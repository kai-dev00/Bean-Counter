"use client";

import { useState } from "react";
import { BiLogOut } from "react-icons/bi";
import { logoutAction } from "../app/actions/auth.logout";
import { CustomModal } from "@/components/CustomModal";
import CustomButton from "@/components/CustomButton";

type LogoutButtonProps = {
  variant?: "icon" | "text";
  className?: string;
};

export default function LogoutButton({
  variant = "icon",
  className = "",
}: LogoutButtonProps) {
  const [open, setOpen] = useState(false);
  const handleClick = (e: React.MouseEvent) => {
    // e.stopPropagation();
    setOpen(true);
  };
  return (
    <>
      {variant === "icon" ? (
        <CustomButton
          size="sm"
          onClick={handleClick}
          aria-label="Logout"
          className={className}
        >
          <BiLogOut />
        </CustomButton>
      ) : (
        <CustomButton
          variant="ghost"
          onClick={handleClick}
          className={`w-full justify-start font-normal ${className}`}
        >
          Logout
        </CustomButton>
      )}

      {/* Confirmation Modal */}
      <CustomModal
        open={open}
        onOpenChange={setOpen}
        title="Confirm logout"
        footer={
          <div className="flex justify-end gap-2">
            <CustomButton
              type="button"
              variant={"outline"}
              onClick={() => setOpen(false)}
            >
              Cancel
            </CustomButton>

            <form action={logoutAction}>
              <CustomButton type="submit" variant={"destructive"}>
                Logout
              </CustomButton>
            </form>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          You will be signed out and redirected to the login page.
        </p>
      </CustomModal>
    </>
  );
}
