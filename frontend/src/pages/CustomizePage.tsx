import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Type,
  Upload,
  Palette,
  RotateCcw,
  Download,
  ShoppingBag,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
} from "lucide-react";

const TSHIRT_COLORS = [
  { name: "White", value: "hsl(0 0% 100%)", class: "bg-[hsl(0_0%_100%)]" },
  { name: "Black", value: "hsl(0 0% 8%)", class: "bg-[hsl(0_0%_8%)]" },
  { name: "Navy", value: "hsl(220 60% 25%)", class: "bg-[hsl(220_60%_25%)]" },
  { name: "Red", value: "hsl(0 80% 45%)", class: "bg-[hsl(0_80%_45%)]" },
  { name: "Forest", value: "hsl(145 50% 30%)", class: "bg-[hsl(145_50%_30%)]" },
  { name: "Orange", value: "hsl(24 95% 53%)", class: "bg-primary" },
  { name: "Grey", value: "hsl(0 0% 50%)", class: "bg-[hsl(0_0%_50%)]" },
  { name: "Olive", value: "hsl(80 40% 35%)", class: "bg-[hsl(80_40%_35%)]" },
];

const FONTS = [
  "Inter",
  "Space Grotesk",
  "Georgia",
  "Courier New",
  "Arial Black",
  "Impact",
  "Comic Sans MS",
  "Trebuchet MS",
];

const TEXT_COLORS = [
  { name: "White", value: "#ffffff" },
  { name: "Black", value: "#141414" },
  { name: "Orange", value: "#f97316" },
  { name: "Gold", value: "#eab308" },
  { name: "Red", value: "#ef4444" },
  { name: "Blue", value: "#3b82f6" },
];

const BASE_PRICE = 1299;
const TEXT_PRICE = 200;
const IMAGE_PRICE = 300;

export default function CustomizePage() {
  const [tshirtColor, setTshirtColor] = useState(TSHIRT_COLORS[0]);
  const [text, setText] = useState("");
  const [textColor, setTextColor] = useState(TEXT_COLORS[1]);
  const [font, setFont] = useState(FONTS[0]);
  const [fontSize, setFontSize] = useState(24);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("center");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"color" | "text" | "upload">("color");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setUploadedImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    setTshirtColor(TSHIRT_COLORS[0]);
    setText("");
    setTextColor(TEXT_COLORS[1]);
    setFont(FONTS[0]);
    setFontSize(24);
    setIsBold(false);
    setIsItalic(false);
    setTextAlign("center");
    setUploadedImage(null);
  };

  const totalPrice =
    BASE_PRICE + (text ? TEXT_PRICE : 0) + (uploadedImage ? IMAGE_PRICE : 0);

  const tabs = [
    { id: "color" as const, label: "Color", icon: Palette },
    { id: "text" as const, label: "Text", icon: Type },
    { id: "upload" as const, label: "Upload", icon: Upload },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border bg-card/50"
      >
        <div className="container mx-auto px-4 py-6">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Design Your Own <span className="text-primary">T-Shirt</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Create something unique — choose colors, add text, upload art.
          </p>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Live Preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center"
          >
            <div className="sticky top-24 w-full">
              <div className="relative mx-auto flex aspect-[3/4] max-w-md items-center justify-center overflow-hidden rounded-3xl border border-border bg-surface-sunken shadow-card">
                {/* T-Shirt shape */}
                <div
                  className="relative flex h-[85%] w-[75%] items-center justify-center rounded-2xl transition-colors duration-500"
                  style={{ backgroundColor: tshirtColor.value }}
                >
                  {/* Collar */}
                  <div
                    className="absolute -top-1 left-1/2 h-8 w-16 -translate-x-1/2 rounded-b-[100%] border-b-2 transition-colors duration-500"
                    style={{
                      borderColor:
                        tshirtColor.name === "White"
                          ? "hsl(0 0% 85%)"
                          : "hsl(0 0% 0% / 0.2)",
                    }}
                  />

                  {/* Sleeves */}
                  <div
                    className="absolute -left-6 top-4 h-20 w-10 rounded-l-xl transition-colors duration-500"
                    style={{ backgroundColor: tshirtColor.value }}
                  />
                  <div
                    className="absolute -right-6 top-4 h-20 w-10 rounded-r-xl transition-colors duration-500"
                    style={{ backgroundColor: tshirtColor.value }}
                  />

                  {/* Print area */}
                  <div className="flex h-[60%] w-[70%] flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-foreground/10 p-4">
                    {uploadedImage && (
                      <img
                        src={uploadedImage}
                        alt="Custom design"
                        className="max-h-32 max-w-full object-contain"
                      />
                    )}
                    {text && (
                      <p
                        className="w-full break-words leading-tight"
                        style={{
                          color: textColor.value,
                          fontFamily: font,
                          fontSize: `${fontSize}px`,
                          fontWeight: isBold ? 700 : 400,
                          fontStyle: isItalic ? "italic" : "normal",
                          textAlign,
                        }}
                      >
                        {text}
                      </p>
                    )}
                    {!text && !uploadedImage && (
                      <span className="text-center text-sm font-medium text-foreground/20">
                        Your design here
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price display below preview */}
              <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Total Price</span>
                  <span className="font-display text-2xl font-extrabold text-card-foreground">
                    ₹{totalPrice}
                  </span>
                </div>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Base T-Shirt</span>
                    <span>₹{BASE_PRICE}</span>
                  </div>
                  {text && (
                    <div className="flex justify-between">
                      <span>Custom Text</span>
                      <span>+₹{TEXT_PRICE}</span>
                    </div>
                  )}
                  {uploadedImage && (
                    <div className="flex justify-between">
                      <span>Custom Image</span>
                      <span>+₹{IMAGE_PRICE}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-all hover:shadow-glow"
                  >
                    <ShoppingBag size={16} />
                    Add to Cart — ₹{totalPrice}
                  </motion.button>
                  <button
                    onClick={handleReset}
                    className="rounded-xl border border-border bg-card p-3 text-muted-foreground transition-colors hover:bg-secondary hover:text-card-foreground"
                    aria-label="Reset"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Customization Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Tabs */}
            <div className="mb-6 flex gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-card">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-card-foreground"
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {/* Color Tab */}
              {activeTab === "color" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <h3 className="mb-4 font-display text-lg font-bold text-card-foreground">
                      T-Shirt Color
                    </h3>
                    <div className="grid grid-cols-4 gap-3">
                      {TSHIRT_COLORS.map((color) => (
                        <button
                          key={color.name}
                          onClick={() => setTshirtColor(color)}
                          className={`group/color flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all ${
                            tshirtColor.name === color.name
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-transparent hover:border-border hover:bg-secondary/50"
                          }`}
                        >
                          <div
                            className={`h-10 w-10 rounded-full border border-border shadow-inner transition-transform group-hover/color:scale-110 ${color.class}`}
                          />
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {color.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <h3 className="mb-3 font-display text-lg font-bold text-card-foreground">
                      Fabric & Quality
                    </h3>
                    <div className="space-y-3">
                      {[
                        { label: "Premium Cotton 220 GSM", desc: "Soft, breathable, everyday comfort", selected: true },
                        { label: "Jersey Material 280 GSM", desc: "Stretchy, durable, sports-ready", selected: false },
                        { label: "Tri-Blend 200 GSM", desc: "Ultra-soft cotton-poly-rayon mix", selected: false },
                      ].map((fabric) => (
                        <label
                          key={fabric.label}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                            fabric.selected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/30"
                          }`}
                        >
                          <div
                            className={`mt-0.5 h-4 w-4 rounded-full border-2 transition-all ${
                              fabric.selected
                                ? "border-primary bg-primary"
                                : "border-muted-foreground"
                            }`}
                          />
                          <div>
                            <p className="text-sm font-semibold text-card-foreground">{fabric.label}</p>
                            <p className="text-xs text-muted-foreground">{fabric.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Text Tab */}
              {activeTab === "text" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <h3 className="mb-4 font-display text-lg font-bold text-card-foreground">
                      Add Text
                    </h3>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Type your text here..."
                      maxLength={60}
                      className="w-full rounded-xl border border-border bg-surface-sunken p-4 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={3}
                    />
                    <p className="mt-1 text-right text-xs text-muted-foreground">
                      {text.length}/60
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <h3 className="mb-4 font-display text-lg font-bold text-card-foreground">
                      Font Style
                    </h3>

                    {/* Font selector */}
                    <div className="relative mb-4">
                      <select
                        value={font}
                        onChange={(e) => setFont(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-border bg-surface-sunken px-4 py-3 pr-10 text-sm font-medium text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        style={{ fontFamily: font }}
                      >
                        {FONTS.map((f) => (
                          <option key={f} value={f} style={{ fontFamily: f }}>
                            {f}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </div>

                    {/* Font size slider */}
                    <div className="mb-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Font Size</span>
                        <span className="text-xs font-bold text-card-foreground">{fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min={12}
                        max={48}
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full accent-primary"
                      />
                    </div>

                    {/* Text formatting */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsBold(!isBold)}
                        className={`rounded-lg border p-2.5 transition-all ${
                          isBold
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        <Bold size={16} />
                      </button>
                      <button
                        onClick={() => setIsItalic(!isItalic)}
                        className={`rounded-lg border p-2.5 transition-all ${
                          isItalic
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        <Italic size={16} />
                      </button>
                      <div className="mx-1 w-px bg-border" />
                      {(["left", "center", "right"] as const).map((align) => {
                        const Icon = align === "left" ? AlignLeft : align === "center" ? AlignCenter : AlignRight;
                        return (
                          <button
                            key={align}
                            onClick={() => setTextAlign(align)}
                            className={`rounded-lg border p-2.5 transition-all ${
                              textAlign === align
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border text-muted-foreground hover:border-primary/50"
                            }`}
                          >
                            <Icon size={16} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Text Color */}
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <h3 className="mb-4 font-display text-lg font-bold text-card-foreground">
                      Text Color
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {TEXT_COLORS.map((c) => (
                        <button
                          key={c.name}
                          onClick={() => setTextColor(c)}
                          className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 transition-all ${
                            textColor.name === c.name
                              ? "border-primary"
                              : "border-transparent hover:border-border"
                          }`}
                        >
                          <div
                            className="h-8 w-8 rounded-full border border-border shadow-inner"
                            style={{ backgroundColor: c.value }}
                          />
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {c.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Upload Tab */}
              {activeTab === "upload" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <h3 className="mb-4 font-display text-lg font-bold text-card-foreground">
                      Upload Your Design
                    </h3>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    {uploadedImage ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center rounded-xl border border-border bg-surface-sunken p-6">
                          <img
                            src={uploadedImage}
                            alt="Uploaded design"
                            className="max-h-48 max-w-full rounded-lg object-contain"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 rounded-xl border border-border bg-secondary py-3 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80"
                          >
                            Replace Image
                          </button>
                          <button
                            onClick={() => setUploadedImage(null)}
                            className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border p-10 transition-all hover:border-primary/50 hover:bg-primary/5"
                      >
                        <div className="rounded-full bg-secondary p-4">
                          <Upload size={24} className="text-primary" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-card-foreground">
                            Click to upload your design
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            PNG, JPG, SVG — Max 5MB
                          </p>
                        </div>
                      </button>
                    )}
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                    <h3 className="mb-3 font-display text-lg font-bold text-card-foreground">
                      Design Tips
                    </h3>
                    <ul className="space-y-2 text-xs text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 text-primary">✦</span>
                        Use high-resolution images (300+ DPI) for best print quality
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 text-primary">✦</span>
                        PNG with transparent background works best
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 text-primary">✦</span>
                        Keep text readable — bold, simple fonts work great on fabric
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 text-primary">✦</span>
                        Consider contrast with your chosen t-shirt color
                      </li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
