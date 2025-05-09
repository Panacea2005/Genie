"use client"

import { useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

const models = [
  { id: "gpt-4o", name: "GPT-4o", description: "Most capable model" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5", description: "Fast responses" },
  { id: "claude-3", name: "Claude 3", description: "Balanced performance" },
]

export default function ModelSelector() {
  const [selectedModel, setSelectedModel] = useState(models[0])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <span>{selectedModel.name}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {models.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => setSelectedModel(model)}
            className="flex items-center justify-between py-2"
          >
            <div>
              <div className="font-medium">{model.name}</div>
              <div className="text-xs text-gray-500">{model.description}</div>
            </div>
            {selectedModel.id === model.id && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
