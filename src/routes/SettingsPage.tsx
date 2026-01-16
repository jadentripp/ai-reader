import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSetting, openAiKeyStatus, openAiListModels, setSetting } from "../lib/tauri";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-4.1-mini");
  const [status, setStatus] = useState<string | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [modelsStatus, setModelsStatus] = useState<string | null>(null);
  const [keyStatus, setKeyStatus] = useState<{ has_env_key: boolean; has_saved_key: boolean } | null>(null);
  const [customModel, setCustomModel] = useState("");

  useEffect(() => {
    (async () => {
      const savedKey = await getSetting("openai_api_key");
      const savedModel = await getSetting("openai_model");
      const savedKeyStatus = await openAiKeyStatus();
      if (savedKey) setApiKey(savedKey);
      if (savedModel) setModel(savedModel);
      setKeyStatus(savedKeyStatus);
      if (savedKeyStatus.has_env_key || savedKeyStatus.has_saved_key || savedKey) {
        loadModels();
      }
    })();
  }, []);

  useEffect(() => {
    setCustomModel(model);
  }, [model]);

  const hasCustomModel = useMemo(() => !models.includes(model), [models, model]);

  async function onSave() {
    setStatus(null);
    if (apiKey.trim()) {
      await setSetting({ key: "openai_api_key", value: apiKey.trim() });
    }
    await setSetting({ key: "openai_model", value: model });
    const savedKeyStatus = await openAiKeyStatus();
    setKeyStatus(savedKeyStatus);
    setStatus("Saved.");
  }

  async function onClearKey() {
    setStatus(null);
    await setSetting({ key: "openai_api_key", value: "" });
    setApiKey("");
    const savedKeyStatus = await openAiKeyStatus();
    setKeyStatus(savedKeyStatus);
    setStatus("Cleared saved key.");
  }

  async function loadModels() {
    setModelsStatus(null);
    try {
      const list = await openAiListModels();
      setModels(list);
      if (list.length && !list.includes(model)) {
        setCustomModel(model);
      }
      setModelsStatus(list.length ? `Loaded ${list.length} models.` : "No recent models returned.");
    } catch (e: any) {
      setModelsStatus(String(e?.message ?? e));
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">Configure your OpenAI credentials and model.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>OpenAI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="openai-key">OpenAI API Key</Label>
            <Input
              id="openai-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.currentTarget.value)}
              placeholder="sk-..."
            />
            <p className="text-xs text-muted-foreground">
              {keyStatus?.has_env_key
                ? "An OpenAI key is also available from the environment."
                : "You can also set OPENAI_API_KEY in the environment."}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model-select">Model</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={hasCustomModel ? "__custom__" : model}
                onValueChange={(value) => {
                  if (value === "__custom__") {
                    setModel(customModel || model);
                  } else {
                    setModel(value);
                  }
                }}
              >
                <SelectTrigger id="model-select" className="w-full sm:w-72">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__custom__">Custom model...</SelectItem>
                  {models.map((modelId) => (
                    <SelectItem key={modelId} value={modelId}>
                      {modelId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" type="button" onClick={loadModels}>
                Refresh
              </Button>
            </div>
            {hasCustomModel ? (
              <Input
                value={customModel}
                onChange={(e) => {
                  setCustomModel(e.currentTarget.value);
                  setModel(e.currentTarget.value);
                }}
                placeholder="gpt-4.1-mini"
              />
            ) : null}
            {modelsStatus ? <p className="text-xs text-muted-foreground">{modelsStatus}</p> : null}
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t">
          <div className="flex flex-wrap gap-2">
            <Button onClick={onSave}>Save</Button>
            <Button variant="outline" onClick={onClearKey} type="button">
              Clear saved key
            </Button>
          </div>
          {status ? <span className="text-sm text-muted-foreground">{status}</span> : null}
        </CardFooter>
      </Card>
    </div>
  );
}
