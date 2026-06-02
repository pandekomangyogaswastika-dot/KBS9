import { useState } from "react";
import { Plus, GripVertical, Trash2, Edit2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BlockInspector from "./BlockInspector";

const BLOCK_TYPES = [
  { value: "hero", label: "Hero Section", icon: "🎯" },
  { value: "gallery", label: "Image Gallery", icon: "🖼️" },
  { value: "cta", label: "Call to Action", icon: "📢" },
  { value: "metrics", label: "Metrics/Stats", icon: "📊" },
  { value: "features", label: "Features List", icon: "✨" },
  { value: "testimonials", label: "Testimonials", icon: "💬" },
  { value: "demoEmbed", label: "Demo/Video Embed", icon: "🎬" },
];

const BLOCK_TEMPLATES = {
  hero: {
    title: "New Hero Section",
    subtitle: "Subtitle",
    summary: "Description goes here",
  },
  gallery: {
    layout: "grid",
    images: [],
  },
  cta: {
    title: "Ready to Get Started?",
    description: "Description",
    buttonText: "Get Started",
    buttonUrl: "#",
    style: "primary",
  },
  metrics: {
    metrics: [
      { value: "100+", label: "Metric 1" },
      { value: "50%", label: "Metric 2" },
    ],
  },
  features: {
    features: [
      { title: "Feature 1", description: "Description" },
      { title: "Feature 2", description: "Description" },
    ],
  },
  testimonials: {
    testimonials: [
      {
        quote: "Testimonial quote here",
        author: "John Doe",
        role: "CEO, Company",
        avatar: "",
      },
    ],
  },
  demoEmbed: {
    title: "Demo Title",
    embedUrl: "",
    posterImage: "",
  },
};

export default function BlockBuilderField({ value = [], onChange, label }) {
  const [blocks, setBlocks] = useState(value || []);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [draggedIndex, setDraggedIndex] = useState(null);

  const updateBlocks = (newBlocks) => {
    setBlocks(newBlocks);
    onChange(newBlocks);
  };

  const addBlock = (type) => {
    const newBlock = {
      id: `block-${Date.now()}`,
      type,
      data: BLOCK_TEMPLATES[type] || {},
    };
    updateBlocks([...blocks, newBlock]);
    setAddDialogOpen(false);
    setSelectedType("");
  };

  const removeBlock = (index) => {
    updateBlocks(blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index, direction) => {
    const newBlocks = [...blocks];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    updateBlocks(newBlocks);
  };

  const updateBlockData = (index, newData) => {
    const newBlocks = [...blocks];
    newBlocks[index].data = newData;
    updateBlocks(newBlocks);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.currentTarget);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newBlocks = [...blocks];
    const draggedBlock = newBlocks[draggedIndex];
    newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(dropIndex, 0, draggedBlock);
    
    updateBlocks(newBlocks);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const getBlockLabel = (type) => {
    const blockType = BLOCK_TYPES.find((b) => b.value === type);
    return blockType ? `${blockType.icon} ${blockType.label}` : type;
  };

  return (
    <div className="space-y-4">
      {label && (
        <label className="text-sm font-medium text-white">{label}</label>
      )}

      {/* Blocks List */}
      <div className="space-y-3">
        {blocks.map((block, index) => (
          <div
            key={block.id || index}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`group relative flex items-center gap-3 rounded-xl border p-4 transition-all cursor-move ${
              draggedIndex === index
                ? "border-[color:var(--kti-teal)] bg-white/10 opacity-50 scale-[0.98]"
                : "border-white/10 bg-white/5 hover:border-white/15"
            }`}
            data-testid={`block-item-${block.type}`}
          >
            {/* Drag Handle */}
            <div className="text-[color:var(--kti-text-faint)] group-hover:text-[color:var(--kti-teal)] transition-colors">
              <GripVertical className="size-5" />
            </div>

            {/* Block Info */}
            <div className="flex-1">
              <div className="font-medium text-white">{getBlockLabel(block.type)}</div>
              <div className="mt-1 text-xs text-[color:var(--kti-text-dim)]">
                ID: {block.id}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => moveBlock(index, "up")}
                disabled={index === 0}
                className="kti-focus p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                data-testid={`block-move-up-${index}`}
              >
                <ChevronUp className="size-4 text-white" />
              </button>
              <button
                onClick={() => moveBlock(index, "down")}
                disabled={index === blocks.length - 1}
                className="kti-focus p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                data-testid={`block-move-down-${index}`}
              >
                <ChevronDown className="size-4 text-white" />
              </button>
              <button
                onClick={() => {
                  setSelectedBlock({ index, block });
                  setInspectorOpen(true);
                }}
                className="kti-focus p-2 rounded-lg hover:bg-white/10"
                data-testid={`block-edit-${index}`}
              >
                <Edit2 className="size-4 text-[color:var(--kti-teal)]" />
              </button>
              <button
                onClick={() => removeBlock(index)}
                className="kti-focus p-2 rounded-lg hover:bg-white/10"
                data-testid={`block-remove-${index}`}
              >
                <Trash2 className="size-4 text-[color:var(--kti-danger)]" />
              </button>
            </div>
          </div>
        ))}

        {blocks.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
            <p className="text-sm text-[color:var(--kti-text-dim)]">No blocks yet. Click "Add Block" to get started.</p>
          </div>
        )}
      </div>

      {/* Add Block Button */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full border-white/15 bg-white/6 hover:bg-white/10"
            data-testid="add-block-button"
          >
            <Plus className="mr-2 size-4" />
            Add Block
          </Button>
        </DialogTrigger>
        <DialogContent className="border-white/10 bg-[#0B0D17]">
          <DialogHeader>
            <DialogTitle className="text-white">Add Content Block</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="border-white/15 bg-white/6">
                <SelectValue placeholder="Select block type" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#0B0D17]">
                {BLOCK_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => selectedType && addBlock(selectedType)}
              disabled={!selectedType}
              className="w-full"
              data-testid="confirm-add-block"
            >
              Add Block
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Block Inspector Dialog */}
      {selectedBlock && (
        <Dialog open={inspectorOpen} onOpenChange={setInspectorOpen}>
          <DialogContent className="max-w-2xl border-white/10 bg-[#0B0D17] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                Edit {getBlockLabel(selectedBlock.block.type)}
              </DialogTitle>
            </DialogHeader>
            <BlockInspector
              blockType={selectedBlock.block.type}
              data={selectedBlock.block.data}
              onChange={(newData) => {
                updateBlockData(selectedBlock.index, newData);
                setInspectorOpen(false);
                setSelectedBlock(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
