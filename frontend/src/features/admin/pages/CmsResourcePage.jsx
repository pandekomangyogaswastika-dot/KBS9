import { useParams } from "react-router-dom";
import ResourceManager from "@/features/admin/cms/ResourceManager";
import { RESOURCE_SCHEMAS } from "@/features/admin/cms/schemas";
import { ErrorView } from "@/components/StateViews";

export default function CmsResourcePage() {
  const { resource } = useParams();
  if (!RESOURCE_SCHEMAS[resource]) {
    return <ErrorView message={`Unknown resource: ${resource}`} />;
  }
  return (
    <div data-testid="cms-resource-page">
      <ResourceManager key={resource} resource={resource} />
    </div>
  );
}
