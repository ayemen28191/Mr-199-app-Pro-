import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFloatingButton } from "./floating-button-context";

export default function FloatingAddButton() {
  const { floatingAction, floatingLabel } = useFloatingButton();
  
  // إذا لم يتم تعيين action، لا نعرض الزر
  if (!floatingAction) {
    return null;
  }

  const handleClick = () => {
    if (floatingAction) {
      floatingAction();
    }
  };

  return (
    <Button
      onClick={handleClick}
      className="fixed bottom-24 left-4 sm:bottom-20 sm:left-4 z-40 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 bg-primary hover:bg-primary/90 safe-area-inset-bottom"
      size="icon"
      title={floatingLabel}
      data-testid="floating-add-button"
    >
      <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
    </Button>
  );
}