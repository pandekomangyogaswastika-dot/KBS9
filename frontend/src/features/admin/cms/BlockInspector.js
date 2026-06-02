import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";

export default function BlockInspector({ blockType, data, onChange }) {
  const [formData, setFormData] = useState(data || {});

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const updateArrayItem = (arrayField, index, itemField, value) => {
    const newArray = [...(formData[arrayField] || [])];
    newArray[index] = { ...newArray[index], [itemField]: value };
    setFormData({ ...formData, [arrayField]: newArray });
  };

  const addArrayItem = (arrayField, template) => {
    const newArray = [...(formData[arrayField] || []), template];
    setFormData({ ...formData, [arrayField]: newArray });
  };

  const removeArrayItem = (arrayField, index) => {
    const newArray = (formData[arrayField] || []).filter((_, i) => i !== index);
    setFormData({ ...formData, [arrayField]: newArray });
  };

  const handleSave = () => {
    onChange(formData);
  };

  const renderField = (label, field, type = "text", placeholder = "") => (
    <div>
      <label className="text-xs font-medium text-[color:var(--kti-text-faint)] uppercase tracking-wider">
        {label}
      </label>
      {type === "textarea" ? (
        <Textarea
          value={formData[field] || ""}
          onChange={(e) => updateField(field, e.target.value)}
          placeholder={placeholder}
          className="mt-1 border-white/15 bg-white/6"
          rows={3}
        />
      ) : (
        <Input
          type={type}
          value={formData[field] || ""}
          onChange={(e) => updateField(field, e.target.value)}
          placeholder={placeholder}
          className="mt-1 border-white/15 bg-white/6"
        />
      )}
    </div>
  );

  const renderHeroFields = () => (
    <div className="space-y-4">
      {renderField("Title", "title", "text", "Enter hero title")}
      {renderField("Subtitle", "subtitle", "text", "Enter subtitle")}
      {renderField("Summary", "summary", "textarea", "Enter description")}
      {renderField("Background Image URL", "backgroundImage", "text", "https://...")}
      {renderField("CTA Text", "ctaText", "text", "Get Started")}
      {renderField("CTA URL", "ctaUrl", "text", "https://...")}
    </div>
  );

  const renderGalleryFields = () => (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-[color:var(--kti-text-faint)] uppercase tracking-wider">
          Layout
        </label>
        <select
          value={formData.layout || "grid"}
          onChange={(e) => updateField("layout", e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/15 bg-white/6 px-3 py-2 text-white"
        >
          <option value="grid">Grid</option>
          <option value="masonry">Masonry</option>
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-[color:var(--kti-text-faint)] uppercase tracking-wider">
            Images
          </label>
          <Button
            type="button"
            size="sm"
            onClick={() => addArrayItem("images", { url: "", caption: "" })}
          >
            <Plus className="mr-1 size-3" /> Add Image
          </Button>
        </div>
        <div className="space-y-3">
          {(formData.images || []).map((img, i) => (
            <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-2">
                  <Input
                    value={img.url || ""}
                    onChange={(e) => updateArrayItem("images", i, "url", e.target.value)}
                    placeholder="Image URL"
                    className="border-white/15 bg-white/6"
                  />
                  <Input
                    value={img.caption || ""}
                    onChange={(e) => updateArrayItem("images", i, "caption", e.target.value)}
                    placeholder="Caption (optional)"
                    className="border-white/15 bg-white/6"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeArrayItem("images", i)}
                >
                  <Trash2 className="size-4 text-[color:var(--kti-danger)]" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCTAFields = () => (
    <div className="space-y-4">
      {renderField("Title", "title", "text", "Enter CTA title")}
      {renderField("Description", "description", "textarea", "Enter description")}
      {renderField("Button Text", "buttonText", "text", "Click Here")}
      {renderField("Button URL", "buttonUrl", "text", "https://...")}
      <div>
        <label className="text-xs font-medium text-[color:var(--kti-text-faint)] uppercase tracking-wider">
          Style
        </label>
        <select
          value={formData.style || "primary"}
          onChange={(e) => updateField("style", e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/15 bg-white/6 px-3 py-2 text-white"
        >
          <option value="primary">Primary</option>
          <option value="teal">Teal</option>
          <option value="ghost">Ghost</option>
        </select>
      </div>
    </div>
  );

  const renderMetricsFields = () => (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-[color:var(--kti-text-faint)] uppercase tracking-wider">
            Metrics
          </label>
          <Button
            type="button"
            size="sm"
            onClick={() => addArrayItem("metrics", { value: "", label: "" })}
          >
            <Plus className="mr-1 size-3" /> Add Metric
          </Button>
        </div>
        <div className="space-y-3">
          {(formData.metrics || []).map((metric, i) => (
            <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Input
                    value={metric.value || ""}
                    onChange={(e) => updateArrayItem("metrics", i, "value", e.target.value)}
                    placeholder="Value (e.g., 100+)"
                    className="border-white/15 bg-white/6"
                  />
                  <Input
                    value={metric.label || ""}
                    onChange={(e) => updateArrayItem("metrics", i, "label", e.target.value)}
                    placeholder="Label"
                    className="border-white/15 bg-white/6"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeArrayItem("metrics", i)}
                >
                  <Trash2 className="size-4 text-[color:var(--kti-danger)]" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFeaturesFields = () => (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-[color:var(--kti-text-faint)] uppercase tracking-wider">
            Features
          </label>
          <Button
            type="button"
            size="sm"
            onClick={() => addArrayItem("features", { title: "", description: "" })}
          >
            <Plus className="mr-1 size-3" /> Add Feature
          </Button>
        </div>
        <div className="space-y-3">
          {(formData.features || []).map((feature, i) => (
            <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-2">
                  <Input
                    value={feature.title || ""}
                    onChange={(e) => updateArrayItem("features", i, "title", e.target.value)}
                    placeholder="Feature Title"
                    className="border-white/15 bg-white/6"
                  />
                  <Textarea
                    value={feature.description || ""}
                    onChange={(e) => updateArrayItem("features", i, "description", e.target.value)}
                    placeholder="Description"
                    className="border-white/15 bg-white/6"
                    rows={2}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeArrayItem("features", i)}
                >
                  <Trash2 className="size-4 text-[color:var(--kti-danger)]" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTestimonialsFields = () => (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-[color:var(--kti-text-faint)] uppercase tracking-wider">
            Testimonials
          </label>
          <Button
            type="button"
            size="sm"
            onClick={() => addArrayItem("testimonials", { quote: "", author: "", role: "", avatar: "" })}
          >
            <Plus className="mr-1 size-3" /> Add Testimonial
          </Button>
        </div>
        <div className="space-y-3">
          {(formData.testimonials || []).map((testimonial, i) => (
            <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-2">
                  <Textarea
                    value={testimonial.quote || ""}
                    onChange={(e) => updateArrayItem("testimonials", i, "quote", e.target.value)}
                    placeholder="Quote"
                    className="border-white/15 bg-white/6"
                    rows={3}
                  />
                  <Input
                    value={testimonial.author || ""}
                    onChange={(e) => updateArrayItem("testimonials", i, "author", e.target.value)}
                    placeholder="Author Name"
                    className="border-white/15 bg-white/6"
                  />
                  <Input
                    value={testimonial.role || ""}
                    onChange={(e) => updateArrayItem("testimonials", i, "role", e.target.value)}
                    placeholder="Role/Title"
                    className="border-white/15 bg-white/6"
                  />
                  <Input
                    value={testimonial.avatar || ""}
                    onChange={(e) => updateArrayItem("testimonials", i, "avatar", e.target.value)}
                    placeholder="Avatar URL (optional)"
                    className="border-white/15 bg-white/6"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeArrayItem("testimonials", i)}
                >
                  <Trash2 className="size-4 text-[color:var(--kti-danger)]" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDemoEmbedFields = () => (
    <div className="space-y-4">
      {renderField("Title", "title", "text", "Demo Title")}
      {renderField("Embed URL", "embedUrl", "text", "https://...")}
      {renderField("Poster Image URL", "posterImage", "text", "https://...")}
    </div>
  );

  const renderFields = () => {
    switch (blockType) {
      case "hero":
        return renderHeroFields();
      case "gallery":
        return renderGalleryFields();
      case "cta":
        return renderCTAFields();
      case "metrics":
        return renderMetricsFields();
      case "features":
        return renderFeaturesFields();
      case "testimonials":
        return renderTestimonialsFields();
      case "demoEmbed":
        return renderDemoEmbedFields();
      default:
        return <p className="text-[color:var(--kti-text-dim)]">Unknown block type</p>;
    }
  };

  return (
    <div className="space-y-6">
      {renderFields()}
      <div className="flex gap-3 pt-4 border-t border-white/10">
        <Button onClick={handleSave} className="flex-1" data-testid="save-block-data">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
