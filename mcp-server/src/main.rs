//! MCP Server (Model Context Protocol)
//!
//! A JSON-RPC 2.0 server that provides AI agent functionality using Google's Gemini API.
//! This server manages multiple specialized AI agents and processes user requests with
//! context-aware responses.
//!
//! # Architecture
//!
//! The server handles JSON-RPC 2.0 requests, routes them to specialized agents, and
//! interfaces with Google's Gemini API for AI-powered responses. Each agent has a unique
//! system prompt that defines its behavior and expertise.
//!
//! # Supported Methods
//!
//! - `list_agents` - Returns all available AI agents
//! - `process_text` - Processes user text through a specified agent

use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
    routing::post,
    Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use reqwest::Client;

/// Application state shared across all request handlers.
///
/// This struct is wrapped in an `Arc` and cloned for each request handler,
/// providing thread-safe access to shared resources.
#[derive(Clone)]
struct AppState {
    /// Shared HTTP client for making requests to Gemini API.
    http_client: Client,
    /// Google Gemini API key for authentication.
    gemini_api_key: String,
}

/// JSON-RPC 2.0 request structure.
///
/// Represents an incoming JSON-RPC request following the 2.0 specification.
///
/// # Type Parameters
///
/// * `T` - The type of the params field
#[derive(Debug, Serialize, Deserialize)]
struct JsonRpcRequest<T> {
    /// Protocol version, must be "2.0"
    jsonrpc: String,
    /// Name of the method to call
    method: String,
    /// Optional parameters for the method
    #[serde(skip_serializing_if = "Option::is_none")]
    params: Option<T>,
    /// Request identifier for matching responses
    id: serde_json::Value,
}

/// JSON-RPC 2.0 response structure.
///
/// Represents an outgoing JSON-RPC response following the 2.0 specification.
///
/// # Type Parameters
///
/// * `T` - The type of the result field
#[derive(Debug, Serialize, Deserialize)]
struct JsonRpcResponse<T> {
    /// Protocol version, always "2.0"
    jsonrpc: String,
    /// Optional result data on success
    #[serde(skip_serializing_if = "Option::is_none")]
    result: Option<T>,
    /// Optional error object on failure
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<JsonRpcError>,
    /// Request identifier matching the original request
    id: serde_json::Value,
}

/// JSON-RPC 2.0 error object.
///
/// Represents an error in JSON-RPC response.
#[derive(Debug, Serialize, Deserialize)]
struct JsonRpcError {
    /// Error code
    code: i32,
    /// Error message
    message: String,
    /// Optional additional error data
    #[serde(skip_serializing_if = "Option::is_none")]
    data: Option<serde_json::Value>,
}

/// Information about an AI agent.
///
/// Represents a specialized AI agent with unique capabilities and system instructions.
#[derive(Debug, Serialize, Deserialize)]
struct Agent {
    /// Unique identifier for the agent
    id: String,
    /// Human-readable name
    name: String,
    /// Brief description of the agent's purpose
    description: String,
    /// List of capabilities (e.g., "text", "web3", "coding")
    capabilities: Vec<String>,
    /// AI model used by this agent (e.g., "gemini-2.0-flash-exp")
    model: String,
    /// System prompt that defines the agent's behavior
    system_prompt: String,
}

/// Request structure for Google Gemini API.
///
/// Represents a request to the Gemini generateContent endpoint.
#[derive(Debug, Serialize, Deserialize)]
struct GeminiRequest {
    /// List of conversation contents (messages)
    contents: Vec<GeminiContent>,
    /// Optional system instruction to define agent behavior
    #[serde(skip_serializing_if = "Option::is_none")]
    system_instruction: Option<GeminiSystemInstruction>,
}

/// A single message/content in the Gemini conversation.
#[derive(Debug, Serialize, Deserialize)]
struct GeminiContent {
    /// Role of the message sender ("user" or "model")
    role: String,
    /// Parts of the message (text, images, etc.)
    parts: Vec<GeminiPart>,
}

/// A part of a Gemini message (currently only text).
#[derive(Debug, Serialize, Deserialize)]
struct GeminiPart {
    /// Text content of the message part
    text: String,
}

/// System instruction for Gemini to define agent behavior.
#[derive(Debug, Serialize, Deserialize)]
struct GeminiSystemInstruction {
    /// Parts containing the system instruction text
    parts: Vec<GeminiPart>,
}

/// Response structure from Google Gemini API.
#[derive(Debug, Serialize, Deserialize)]
struct GeminiResponse {
    /// List of candidate responses (usually one)
    candidates: Vec<GeminiCandidate>,
    /// Optional metadata about token usage
    #[serde(skip_serializing_if = "Option::is_none")]
    usage_metadata: Option<GeminiUsageMetadata>,
}

/// A single candidate response from Gemini.
#[derive(Debug, Serialize, Deserialize)]
struct GeminiCandidate {
    /// Content of the candidate response
    content: GeminiContent,
}

/// Metadata about token usage in the Gemini API call.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GeminiUsageMetadata {
    /// Number of tokens in the prompt
    prompt_token_count: Option<u32>,
    /// Number of tokens in the generated response
    candidates_token_count: Option<u32>,
    /// Total tokens used (prompt + response)
    total_token_count: Option<u32>,
}

/// Result of the list_agents JSON-RPC method.
#[derive(Debug, Serialize, Deserialize)]
struct ListAgentsResult {
    /// List of all available agents
    agents: Vec<Agent>,
}

/// Parameters for the process_text JSON-RPC method.
#[derive(Debug, Serialize, Deserialize)]
struct ProcessTextParams {
    /// ID of the agent to process the text
    agent_id: String,
    /// User's text input
    user_text: String,
    /// Optional conversation history for context
    #[serde(skip_serializing_if = "Option::is_none")]
    conversation_history: Option<Vec<Message>>,
}

/// A message in the conversation history.
#[derive(Debug, Serialize, Deserialize, Clone)]
struct Message {
    /// Role of the message sender ("user" or "assistant")
    role: String,
    /// Content of the message
    content: String,
}

/// Result of the process_text JSON-RPC method.
#[derive(Debug, Serialize, Deserialize)]
struct ProcessTextResult {
    /// ID of the agent that processed the text
    agent_id: String,
    /// Agent's text response
    reply_text: String,
    /// Metadata about the processing
    metadata: ProcessingMetadata,
}

/// Metadata about text processing.
#[derive(Debug, Serialize, Deserialize)]
struct ProcessingMetadata {
    /// AI model used
    model: String,
    /// Number of tokens consumed (if available)
    tokens_used: Option<u32>,
    /// Processing time in milliseconds
    processing_time_ms: u64,
    /// Confidence score (currently hardcoded)
    confidence: f64,
}

/// Returns the list of all available AI agents.
///
/// Each agent has a unique ID, name, description, capabilities, and system prompt.
/// The system prompt defines the agent's behavior and expertise area.
///
/// # Available Agents
///
/// - `agent_001` - General Assistant (general-purpose)
/// - `agent_002` - Web3 Expert (blockchain, crypto, DeFi)
/// - `agent_003` - Voice Specialist (conversational, voice-optimized)
/// - `agent_004` - Code Assistant (programming, debugging)
///
/// # Returns
///
/// A vector of `Agent` structs representing all available agents.
fn get_agents() -> Vec<Agent> {
    vec![
        Agent {
            id: "agent_001".to_string(),
            name: "General Assistant".to_string(),
            description: "A helpful general-purpose AI assistant powered by Gemini".to_string(),
            capabilities: vec!["text".to_string(), "conversation".to_string(), "reasoning".to_string()],
            model: "gemini-2.0-flash-exp".to_string(),
            system_prompt: "You are a helpful, friendly, and knowledgeable AI assistant. Provide clear, accurate, and concise responses.".to_string(),
        },
        Agent {
            id: "agent_002".to_string(),
            name: "Web3 Expert".to_string(),
            description: "Specialized in blockchain, Web3, and cryptocurrency technologies".to_string(),
            capabilities: vec!["web3".to_string(), "crypto".to_string(), "blockchain".to_string(), "nft".to_string()],
            model: "gemini-2.0-flash-exp".to_string(),
            system_prompt: "You are a Web3 and blockchain expert. Help users understand cryptocurrency, NFTs, smart contracts, DeFi, and related technologies. Provide accurate technical information and practical guidance.".to_string(),
        },
        Agent {
            id: "agent_003".to_string(),
            name: "Voice Specialist".to_string(),
            description: "Optimized for natural voice conversations and audio interactions".to_string(),
            capabilities: vec!["voice".to_string(), "audio".to_string(), "conversation".to_string()],
            model: "gemini-2.0-flash-exp".to_string(),
            system_prompt: "You are an AI assistant optimized for voice interactions. Respond in a natural, conversational tone suitable for speech. Keep responses concise and easy to understand when spoken aloud.".to_string(),
        },
        Agent {
            id: "agent_004".to_string(),
            name: "Code Assistant".to_string(),
            description: "Expert in programming, software development, and technical problem-solving".to_string(),
            capabilities: vec!["coding".to_string(), "debugging".to_string(), "technical".to_string()],
            model: "gemini-2.0-flash-exp".to_string(),
            system_prompt: "You are an expert programming assistant. Help users with code, debugging, architecture, and technical decisions. Provide clear explanations and working code examples.".to_string(),
        },
    ]
}

/// Main JSON-RPC 2.0 request handler.
///
/// Routes incoming JSON-RPC requests to the appropriate handler based on the method name.
/// Validates the JSON-RPC version and returns appropriate error responses for invalid requests.
///
/// # Supported Methods
///
/// - `list_agents` - Lists all available agents
/// - `process_text` - Processes user text through an agent
///
/// # Arguments
///
/// * `state` - Shared application state
/// * `request` - JSON-RPC request with dynamic params
///
/// # Returns
///
/// A JSON-RPC response with either result or error
async fn handle_jsonrpc(
    State(state): State<Arc<AppState>>,
    Json(request): Json<JsonRpcRequest<serde_json::Value>>,
) -> Json<JsonRpcResponse<serde_json::Value>> {
    tracing::info!("Received JSON-RPC request: method={}", request.method);

    if request.jsonrpc != "2.0" {
        return Json(JsonRpcResponse {
            jsonrpc: "2.0".to_string(),
            result: None,
            error: Some(JsonRpcError {
                code: -32600,
                message: "Invalid Request: jsonrpc must be '2.0'".to_string(),
                data: None,
            }),
            id: request.id,
        });
    }

    match request.method.as_str() {
        "list_agents" => handle_list_agents(request).await,
        "process_text" => handle_process_text(State(state), request).await,
        _ => Json(JsonRpcResponse {
            jsonrpc: "2.0".to_string(),
            result: None,
            error: Some(JsonRpcError {
                code: -32601,
                message: format!("Method not found: {}", request.method),
                data: None,
            }),
            id: request.id,
        }),
    }
}

/// Handles the `list_agents` JSON-RPC method.
///
/// Returns a list of all available AI agents with their metadata.
///
/// # Arguments
///
/// * `request` - The JSON-RPC request
///
/// # Returns
///
/// A JSON-RPC response containing the list of agents
async fn handle_list_agents(
    request: JsonRpcRequest<serde_json::Value>,
) -> Json<JsonRpcResponse<serde_json::Value>> {
    let agents = get_agents();
    let result = ListAgentsResult { agents };

    Json(JsonRpcResponse {
        jsonrpc: "2.0".to_string(),
        result: Some(serde_json::to_value(result).unwrap()),
        error: None,
        id: request.id,
    })
}

/// Handles the `process_text` JSON-RPC method.
///
/// Processes user text through a specified agent using Google's Gemini API.
/// This includes:
/// 1. Validating the agent ID
/// 2. Building the Gemini API request with system instructions and conversation history
/// 3. Calling the Gemini API
/// 4. Parsing the response and extracting the agent's reply
/// 5. Returning metadata about tokens used and processing time
///
/// # Arguments
///
/// * `state` - Shared application state containing the HTTP client and API key
/// * `request` - JSON-RPC request containing agent_id, user_text, and optional conversation history
///
/// # Returns
///
/// A JSON-RPC response containing the agent's reply and metadata, or an error
///
/// # Errors
///
/// Returns JSON-RPC errors for:
/// - Invalid parameters
/// - Unknown agent ID
/// - Gemini API failures
/// - Response parsing errors
async fn handle_process_text(
    State(state): State<Arc<AppState>>,
    request: JsonRpcRequest<serde_json::Value>,
) -> Json<JsonRpcResponse<serde_json::Value>> {
    let params: ProcessTextParams = match request.params {
        Some(ref p) => match serde_json::from_value(p.clone()) {
            Ok(params) => params,
            Err(e) => {
                return Json(JsonRpcResponse {
                    jsonrpc: "2.0".to_string(),
                    result: None,
                    error: Some(JsonRpcError {
                        code: -32602,
                        message: format!("Invalid params: {}", e),
                        data: None,
                    }),
                    id: request.id,
                });
            }
        },
        None => {
            return Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: None,
                error: Some(JsonRpcError {
                    code: -32602,
                    message: "Invalid params: agent_id and user_text are required".to_string(),
                    data: None,
                }),
                id: request.id,
            });
        }
    };

    let agents = get_agents();
    let agent = match agents.iter().find(|a| a.id == params.agent_id) {
        Some(a) => a,
        None => {
            return Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: None,
                error: Some(JsonRpcError {
                    code: -32602,
                    message: format!("Agent not found: {}", params.agent_id),
                    data: None,
                }),
                id: request.id,
            });
        }
    };

    let start_time = std::time::Instant::now();

    let mut contents = vec![];

    if let Some(history) = params.conversation_history {
        for msg in history {
            let role = match msg.role.as_str() {
                "user" => "user",
                "assistant" => "model",
                _ => continue,
            };
            contents.push(GeminiContent {
                role: role.to_string(),
                parts: vec![GeminiPart {
                    text: msg.content,
                }],
            });
        }
    }

    contents.push(GeminiContent {
        role: "user".to_string(),
        parts: vec![GeminiPart {
            text: params.user_text.clone(),
        }],
    });

    let gemini_request = GeminiRequest {
        contents,
        system_instruction: Some(GeminiSystemInstruction {
            parts: vec![GeminiPart {
                text: agent.system_prompt.clone(),
            }],
        }),
    };

    let api_url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent",
        agent.model
    );

    let response = match state
        .http_client
        .post(&api_url)
        .header("x-goog-api-key", &state.gemini_api_key)
        .header("Content-Type", "application/json")
        .json(&gemini_request)
        .send()
        .await
    {
        Ok(resp) => resp,
        Err(e) => {
            tracing::error!("Gemini API request error: {:?}", e);
            return Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: None,
                error: Some(JsonRpcError {
                    code: -32603,
                    message: "Internal error: Gemini API request failed".to_string(),
                    data: Some(serde_json::json!({ "details": e.to_string() })),
                }),
                id: request.id,
            });
        }
    };

    let response_status = response.status();
    let response_text = match response.text().await {
        Ok(text) => text,
        Err(e) => {
            tracing::error!("Failed to read Gemini response body: {:?}", e);
            return Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: None,
                error: Some(JsonRpcError {
                    code: -32603,
                    message: "Internal error: Failed to read Gemini response".to_string(),
                    data: Some(serde_json::json!({ "details": e.to_string() })),
                }),
                id: request.id,
            });
        }
    };

    if !response_status.is_success() {
        tracing::error!("Gemini API error response ({}): {}", response_status, response_text);
        return Json(JsonRpcResponse {
            jsonrpc: "2.0".to_string(),
            result: None,
            error: Some(JsonRpcError {
                code: -32603,
                message: "Gemini API error".to_string(),
                data: Some(serde_json::json!({ 
                    "status": response_status.as_u16(),
                    "body": response_text 
                })),
            }),
            id: request.id,
        });
    }

    tracing::info!("Gemini API response: {}", response_text);

    let gemini_response: GeminiResponse = match serde_json::from_str(&response_text) {
        Ok(resp) => resp,
        Err(e) => {
            tracing::error!("Gemini API response parse error: {:?}", e);
            tracing::error!("Raw response was: {}", response_text);
            return Json(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                result: None,
                error: Some(JsonRpcError {
                    code: -32603,
                    message: "Internal error: Failed to parse Gemini response".to_string(),
                    data: Some(serde_json::json!({ 
                        "details": e.to_string(),
                        "raw_response": response_text 
                    })),
                }),
                id: request.id,
            });
        }
    };

    let processing_time = start_time.elapsed().as_millis() as u64;

    let reply_text = gemini_response
        .candidates
        .first()
        .and_then(|c| c.content.parts.first())
        .map(|p| p.text.clone())
        .unwrap_or_else(|| "Sorry, I couldn't generate a response.".to_string());

    let tokens_used = gemini_response
        .usage_metadata
        .and_then(|u| u.total_token_count);

    let result = ProcessTextResult {
        agent_id: params.agent_id,
        reply_text,
        metadata: ProcessingMetadata {
            model: agent.model.clone(),
            tokens_used,
            processing_time_ms: processing_time,
            confidence: 0.95,
        },
    };

    Json(JsonRpcResponse {
        jsonrpc: "2.0".to_string(),
        result: Some(serde_json::to_value(result).unwrap()),
        error: None,
        id: request.id,
    })
}

/// Main entry point for the MCP server.
///
/// Initializes the server with:
/// - Environment variable loading from .env file
/// - Structured logging with tracing
/// - CORS middleware for cross-origin requests
/// - Shared application state with Gemini API key
/// - JSON-RPC route at the root path
///
/// # Environment Variables
///
/// * `GEMINI_API_KEY` - Required. Google Gemini API key for agent responses
/// * `RUST_LOG` - Optional. Logging level (default: info)
///
/// # Panics
///
/// Panics if:
/// - GEMINI_API_KEY is not set
/// - Server fails to bind to port 3000
#[tokio::main]
async fn main() {
    dotenv::dotenv().ok();

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "mcp_server=debug,tower_http=debug,axum=trace".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let gemini_api_key = std::env::var("GEMINI_API_KEY")
        .expect("GEMINI_API_KEY must be set in .env file");

    let http_client = Client::new();

    let state = Arc::new(AppState {
        http_client,
        gemini_api_key,
    });

    let app = Router::new()
        .route("/", post(handle_jsonrpc))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000")
        .await
        .expect("Failed to bind to port 3000");

    tracing::info!("🚀 MCP Server starting on http://0.0.0.0:3000");
    tracing::info!("📋 Available agents: {}", get_agents().len());
    tracing::info!("🤖 Using Google Gemini for agent responses");
    tracing::info!("📡 Supported JSON-RPC methods:");
    tracing::info!("   - list_agents");
    tracing::info!("   - process_text");

    axum::serve(listener, app)
        .await
        .expect("Failed to start server");
}
