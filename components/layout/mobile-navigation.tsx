"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { useRef, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

import { Brand } from "./brand";
import { NavigationContent } from "./navigation";

const subscribeToHydration = () => () => undefined;
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

export function MobileNavigation() {
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Open navigation"
        disabled={!hydrated}
        onClick={() => setOpen(true)}
        ref={triggerRef}
        size="icon"
        type="button"
        variant="ghost"
      >
        {hydrated ? <Menu aria-hidden="true" /> : <span aria-hidden="true" className="size-5" />}
      </Button>
      <Dialog.Root onOpenChange={setOpen} open={open}>
        <Dialog.Portal>
          <Dialog.Overlay className="bg-foreground/30 fixed inset-0 z-50 opacity-0 backdrop-blur-[2px] transition-opacity data-[state=open]:opacity-100" />
          <Dialog.Content
            className="border-border bg-surface fixed inset-y-0 left-0 z-50 flex w-[min(20rem,88vw)] -translate-x-full flex-col border-r shadow-xl transition-transform data-[state=open]:translate-x-0"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              triggerRef.current?.focus();
            }}
          >
            <Dialog.Title className="sr-only">Application navigation</Dialog.Title>
            <Dialog.Description className="sr-only">
              Navigate the Electrolyte Pathways clinical workspace.
            </Dialog.Description>
            <div className="border-border flex h-[4.5rem] items-center justify-between border-b px-4">
              <Brand />
              <Dialog.Close asChild>
                <Button aria-label="Close navigation" size="icon" type="button" variant="ghost">
                  <X aria-hidden="true" />
                </Button>
              </Dialog.Close>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-5">
              <NavigationContent />
            </div>
            <div className="border-border bg-surface-subtle text-muted border-t px-4 py-3 text-xs leading-5">
              Pathways remain locked during clinical review.
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
