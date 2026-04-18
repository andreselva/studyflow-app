import * as React from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type SheetContextValue = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const SheetContext = React.createContext<SheetContextValue | null>(null);

function useSheetContext() {
  const context = React.useContext(SheetContext);
  if (!context) {
    throw new Error("Sheet components must be used inside <Sheet>.");
  }
  return context;
}

function Sheet({
  open,
  onOpenChange,
  children,
}: React.PropsWithChildren<SheetContextValue>) {
  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
}

function SheetPortal({ children }: React.PropsWithChildren) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<"button">) {
  const { open, onOpenChange } = useSheetContext();
  if (!open) return null;

  return (
    <SheetPortal>
      <button
        type="button"
        aria-label="Fechar painel lateral"
        className={cn(
          "fixed inset-0 z-40 bg-[rgba(34,52,44,0.16)] backdrop-blur-[5px]",
          className,
        )}
        onClick={() => onOpenChange(false)}
        {...props}
      />
    </SheetPortal>
  );
}

function SheetContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { open } = useSheetContext();
  if (!open) return null;

  return (
    <SheetPortal>
      <div
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-full max-w-xl overflow-y-auto border-l border-white/60 bg-[#f9f5ec]/95 px-4 py-4 shadow-[-24px_0_60px_rgba(23,49,38,0.14)] backdrop-blur sm:px-6 sm:py-6 md:px-8",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </SheetPortal>
  );
}

function SheetHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("flex items-start justify-between gap-4", className)} {...props} />;
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<"h2">) {
  return <h2 className={cn("mt-1 text-lg font-semibold text-[#173126] sm:mt-2 sm:text-2xl", className)} {...props} />;
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return <p className={cn("mt-2 text-sm text-[#617269]", className)} {...props} />;
}

function SheetClose({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { onOpenChange } = useSheetContext();

  return (
    <Button
      type="button"
      variant="ghost"
      className={cn("text-[#617269] hover:bg-white/70 hover:text-[#173126]", className)}
      onClick={() => onOpenChange(false)}
      {...props}
    />
  );
}

function SheetCloseIcon() {
  return <X />;
}

export {
  Sheet,
  SheetClose,
  SheetCloseIcon,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetOverlay,
  SheetTitle,
};
