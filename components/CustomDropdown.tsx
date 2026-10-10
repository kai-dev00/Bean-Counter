"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export type SelectOption = {
  label: string;
  value: string;
};

// Menu mode: any trigger, any items (filters, action menus)
type MenuProps = {
  trigger: ReactNode;
  /** Pass a function to get a `close` callback (e.g. for keyboard selection) */
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: "left" | "right" | "center";
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
  disabled?: boolean;
  /**
   * Render the menu at the modal (or page) level, below the trigger and as
   * wide as it. Use inside scrolling containers so the menu isn't clipped.
   */
  portal?: boolean;
};

// Select mode: a form field with label, selected value(s) and error message
type SelectBaseProps = {
  /** Field label shown above the trigger; omit when using a custom trigger */
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  /** Show a search box that filters the options (default: true) */
  searchable?: boolean;
  /** Replace the default field-style trigger (e.g. a filter chip) */
  trigger?: ReactNode;
  /** Extra classes for the open menu */
  menuClassName?: string;
};

type SingleSelectProps = SelectBaseProps & {
  multiple?: false;
  value?: string;
  onChange: (value: string) => void;
};

type MultiSelectProps = SelectBaseProps & {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
};

type SelectProps = SingleSelectProps | MultiSelectProps;

type CustomDropdownProps = MenuProps | SelectProps;

// Overloads so onChange gets the right value type (string vs string[])
function CustomDropdown(props: MultiSelectProps): React.JSX.Element;
function CustomDropdown(props: SingleSelectProps): React.JSX.Element;
function CustomDropdown(props: MenuProps): React.JSX.Element;
function CustomDropdown(props: CustomDropdownProps) {
  return "options" in props ? (
    <SelectDropdown {...props} />
  ) : (
    <MenuDropdown {...props} />
  );
}

export default CustomDropdown;

type MenuPosition = {
  target: HTMLElement;
  top: number;
  left: number;
  width: number;
};

function MenuDropdown({
  trigger,
  children,
  align = "left",
  side = "top",
  className = "",
  disabled = false,
  portal = false,
}: MenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const isInside = (node: EventTarget | null) =>
      node instanceof Node &&
      (dropdownRef.current?.contains(node) || menuRef.current?.contains(node));

    const handleClickOutside = (event: MouseEvent) => {
      if (!isInside(event.target)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    // A portaled menu doesn't follow its trigger, so close it on scroll/resize
    const handleScroll = (event: Event) => {
      if (!isInside(event.target)) setIsOpen(false);
    };
    const handleResize = () => setIsOpen(false);

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    if (portal) {
      document.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleResize);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, portal]);

  const openDropdown = () => {
    if (portal && dropdownRef.current) {
      // Inside a dialog, render into it so the dialog doesn't treat clicks
      // on the menu as "outside" clicks
      const target =
        dropdownRef.current.closest<HTMLElement>('[role="dialog"]') ??
        document.body;
      const rect = dropdownRef.current.getBoundingClientRect();
      const base =
        target === document.body
          ? { top: -window.scrollY, left: -window.scrollX }
          : target.getBoundingClientRect();
      setMenuPosition({
        target,
        top: rect.bottom - base.top - target.clientTop + target.scrollTop + 4,
        left: rect.left - base.left - target.clientLeft + target.scrollLeft,
        width: rect.width,
      });
    }
    setIsOpen(true);
  };

  const toggleDropdown = () => {
    if (disabled) return;
    if (isOpen) setIsOpen(false);
    else openDropdown();
  };

  const closeDropdown = () => setIsOpen(false);
  const menuContent =
    typeof children === "function" ? children(closeDropdown) : children;

  // Position classes based on side
  const positionClasses = {
    top: "bottom-full mb-2",
    bottom: "top-full mt-2",
    left: "right-full mr-2",
    right: "left-full ml-2",
  }[side];

  // Alignment classes
  const alignClasses = {
    left: side === "left" || side === "right" ? "top-0" : "left-0",
    right: side === "left" || side === "right" ? "bottom-0" : "right-0",
    center:
      side === "left" || side === "right"
        ? "top-1/2 -translate-y-1/2"
        : "left-1/2 -translate-x-1/2",
  }[align];

  const menuClasses = `bg-popover text-popover-foreground rounded-lg shadow-lg border border-border py-1 z-50 ${className}`;

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={toggleDropdown}>{trigger}</div>

      {isOpen &&
        (portal && menuPosition ? (
          createPortal(
            <div
              ref={menuRef}
              className={`absolute ${menuClasses}`}
              style={{
                top: menuPosition.top,
                left: menuPosition.left,
                minWidth: menuPosition.width,
              }}
              onClick={closeDropdown}
            >
              {menuContent}
            </div>,
            menuPosition.target,
          )
        ) : (
          <div
            ref={menuRef}
            className={`absolute ${positionClasses} ${alignClasses} ${menuClasses}`}
            onClick={closeDropdown}
          >
            {menuContent}
          </div>
        ))}
    </div>
  );
}

function SelectDropdown(props: SelectProps) {
  const {
    label,
    options,
    placeholder = "Select an option",
    required,
    error,
    disabled,
    className,
    searchable = true,
    trigger,
    menuClassName,
  } = props;

  // Work with an array either way; single mode just has 0 or 1 items
  const selectedValues = props.multiple
    ? props.value
    : props.value
      ? [props.value]
      : [];
  const selectedLabels = options
    .filter((opt) => selectedValues.includes(opt.value))
    .map((opt) => opt.label);

  const toggle = (value: string) => {
    if (props.multiple) {
      props.onChange(
        selectedValues.includes(value)
          ? selectedValues.filter((v) => v !== value)
          : [...selectedValues, value],
      );
    } else {
      props.onChange(value);
    }
  };

  const triggerText =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length <= 2
        ? selectedLabels.join(", ")
        : `${selectedLabels.length} selected`;

  const dropdown = (
    <MenuDropdown
      portal
      disabled={disabled}
      className={cn("max-h-72 overflow-y-auto", menuClassName)}
      trigger={
        trigger ?? (
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "border-input dark:bg-input/30 dark:hover:bg-input/50 focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
              error && "border-destructive focus-visible:ring-destructive/20",
              className,
            )}
          >
            <span
              className={cn(
                "truncate",
                selectedLabels.length === 0 && "text-muted-foreground",
              )}
            >
              {triggerText}
            </span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        )
      }
    >
      {(close) => (
        <SelectMenu
          options={options}
          selectedValues={selectedValues}
          multiple={Boolean(props.multiple)}
          onToggle={toggle}
          close={close}
          searchable={searchable}
        />
      )}
    </MenuDropdown>
  );

  // Custom trigger (e.g. filter chip): no field label/error wrapper
  if (trigger) return dropdown;

  return (
    <div className="space-y-1">
      {/* Label + Error */}
      {(label || error) && (
        <div className="flex items-center justify-between">
          <Label>
            {label}
            {required && <span className="ml-1 text-destructive">*</span>}
          </Label>

          {error && <span className="text-xs text-destructive">{error}</span>}
        </div>
      )}
      {dropdown}
    </div>
  );
}

// Lives inside the open menu, so the search resets every time it opens
function SelectMenu({
  options,
  selectedValues,
  multiple,
  onToggle,
  close,
  searchable,
}: {
  options: SelectOption[];
  selectedValues: string[];
  multiple: boolean;
  onToggle: (value: string) => void;
  close: () => void;
  searchable: boolean;
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Keep the keyboard-highlighted option visible in long lists
  useEffect(() => {
    listRef.current?.children[activeIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [activeIndex]);

  const search = query.trim().toLowerCase();
  const filtered = search
    ? options.filter((opt) => opt.label.toLowerCase().includes(search))
    : options;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      // Keep Enter from submitting the surrounding form
      e.preventDefault();
      const opt = filtered[activeIndex];
      if (opt) {
        onToggle(opt.value);
        // Multi-select stays open so several options can be picked
        if (!multiple) close();
      }
    }
  };

  return (
    <>
      {searchable && (
        <div
          className="sticky -top-1 -mt-1 mb-1 bg-popover border-b border-border p-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 rounded-md border border-input px-2">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search..."
              className="h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
      )}
      {filtered.length === 0 && (
        <p className="px-4 py-2 text-sm text-muted-foreground">
          {options.length === 0 ? "No options" : "No matches"}
        </p>
      )}
      <div ref={listRef}>
        {filtered.map((opt, index) => {
          const isSelected = selectedValues.includes(opt.value);
          return (
            <DropdownItem
              key={opt.value}
              onClick={(e) => {
                // Multi-select keeps the menu open between picks
                if (multiple) e.stopPropagation();
                onToggle(opt.value);
              }}
              onMouseEnter={() => setActiveIndex(index)}
              className={cn(
                "flex items-center gap-2",
                searchable && index === activeIndex && "bg-muted",
                // Selected options get a darker background instead of a checkbox
                isSelected &&
                  "bg-primary/15 hover:bg-primary/20 font-medium text-primary",
              )}
            >
              <span className="truncate flex-1">{opt.label}</span>
              {!multiple && isSelected && <Check className="size-4 shrink-0" />}
            </DropdownItem>
          );
        })}
      </div>
    </>
  );
}

export function DropdownItem({
  children,
  onClick,
  onMouseEnter,
  className = "",
}: {
  children: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseEnter?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        "w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function DropdownHeader({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-4 py-3 border-b border-border ${className}`}>
      {children}
    </div>
  );
}

export function DropdownDivider() {
  return <div className="border-t border-border my-1" />;
}
