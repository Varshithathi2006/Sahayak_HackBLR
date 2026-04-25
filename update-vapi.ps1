$headers = @{
    "Authorization" = "Bearer 685b834d-c501-449b-b9ad-5f5f32200447"
    "Content-Type"  = "application/json"
}

$newUrl = "https://31bb-122-171-18-80.ngrok-free.app/api/webhook/vapi"

# Fetch current assistant to get existing model config
$current = Invoke-RestMethod -Method Get `
    -Uri "https://api.vapi.ai/assistant/7c116dd7-282e-4edf-8b6a-cb0bcf735ef1" `
    -Headers $headers

Write-Host "Current model: $($current.model.model) | provider: $($current.model.provider)"

# Rebuild tools with updated server URL
$tools = @(
    @{
        type = "function"
        function = @{
            name = "update_form_field"
            parameters = @{
                type = "object"
                required = @("field", "value")
                properties = @{
                    field = @{
                        type = "string"
                        enum = @("name", "age", "eliglible")
                    }
                    value = @{ type = "string" }
                }
            }
        }
        server = @{ url = $newUrl }
    }
)

$body = @{
    serverUrl = $newUrl
    model = @{
        provider    = $current.model.provider
        model       = $current.model.model
        temperature = $current.model.temperature
        systemPrompt = $current.model.systemPrompt
        tools       = $tools
    }
} | ConvertTo-Json -Depth 10

$response = Invoke-RestMethod -Method Patch `
    -Uri "https://api.vapi.ai/assistant/7c116dd7-282e-4edf-8b6a-cb0bcf735ef1" `
    -Headers $headers `
    -Body $body

Write-Host "✅ Full update done!"
Write-Host "serverUrl: $($response.serverUrl)"
Write-Host "Tool server: $($response.model.tools[0].server.url)"
