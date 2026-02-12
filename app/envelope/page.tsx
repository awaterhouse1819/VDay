import InteractiveEnvelope from "@/components/InteractiveEnvelope";

export const dynamic = "force-dynamic";

export default function EnvelopeDemoPage() {
  return (
    <main>
      <InteractiveEnvelope
        initialMessage={{
          title: "A note for us",
          bodyHtml:
            "<p>Write like you're sealing this up for future-us...</p><p>Start with a memory, then add the feeling.</p>",
          signature: "Always yours"
        }}
        onSave={(message) => {
          console.log("Saved", message);
        }}
      />
    </main>
  );
}
