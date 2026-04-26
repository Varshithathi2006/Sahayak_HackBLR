import Vapi from "@vapi-ai/web";

let vapiInstance: InstanceType<typeof Vapi> | null = null;

export function getVapiClient(): InstanceType<typeof Vapi> {
  if (!vapiInstance) {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "";
    
    console.log("🛠️ Vapi Client Initialization");
    console.log(`🔍 Using Public Key: ${publicKey.slice(0, 10)}...`);
    
    if (!publicKey || publicKey === "your_vapi_public_key_here") {
      console.warn("⚠️  NEXT_PUBLIC_VAPI_PUBLIC_KEY is not set or using placeholder.");
    }
    vapiInstance = new Vapi(publicKey);
  }
  return vapiInstance;
}
