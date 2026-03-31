import React, { useState, useRef, useEffect } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import jsQR from "jsqr";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, Type, Contact, Wifi, Image as ImageIcon, Download, Settings, Palette, Moon, Sun, Wallet, Github } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("url");
  const [qrValue, setQrValue] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [isPayRoute, setIsPayRoute] = useState(false);
  const [payData, setPayData] = useState({ w: "", a: "", q: "" });
  const [payEnv, setPayEnv] = useState<"wechat" | "alipay" | "qq" | "browser" | null>(null);
  
  // Customization state
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("pay") === "1") {
      const w = params.get("w") || "";
      const a = params.get("a") || "";
      const q = params.get("q") || "";
      const ua = navigator.userAgent.toLowerCase();
      
      setPayData({ w, a, q });
      setIsPayRoute(true);

      if (ua.includes("micromessenger") && w) {
        setPayEnv("wechat");
      } else if (ua.includes("alipay") && a) {
        setPayEnv("alipay");
        window.location.href = a;
      } else if (ua.match(/qq\//i) && q) {
        setPayEnv("qq");
      } else {
        setPayEnv("browser");
      }
    }
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);
  const [size, setSize] = useState(256);
  const [margin, setMargin] = useState(4);
  const marginValue = React.useMemo(() => [margin], [margin]);
  const [errorCorrection, setErrorCorrection] = useState<"L" | "M" | "Q" | "H">("M");
  
  // Logo state
  const [logoUrl, setLogoUrl] = useState("");
  const [logoSize, setLogoSize] = useState(0.2); // 20% of QR code size
  const logoSizeValue = React.useMemo(() => [logoSize], [logoSize]);

  // Input states
  const [urlInput, setUrlInput] = useState("");
  const [textInput, setTextInput] = useState("");
  
  // VCard states
  const [vcard, setVcard] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    company: "",
    title: "",
    website: ""
  });

  // Wifi states
  const [wifi, setWifi] = useState({
    ssid: "",
    password: "",
    encryption: "WPA"
  });

  // Pay states
  const [payUrls, setPayUrls] = useState({ wechat: "", alipay: "", qq: "" });

  const qrRef = useRef<HTMLDivElement>(null);

  const updatePayQrValue = (urls: { wechat: string, alipay: string, qq: string }) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    params.set("pay", "1");
    if (urls.wechat) params.set("w", urls.wechat);
    if (urls.alipay) params.set("a", urls.alipay);
    if (urls.qq) params.set("q", urls.qq);
    
    if (!urls.wechat && !urls.alipay && !urls.qq) {
      setQrValue(" ");
    } else {
      setQrValue(`${baseUrl}?${params.toString()}`);
    }
  };

  const handlePayUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'wechat' | 'alipay' | 'qq') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            const newUrls = { ...payUrls, [type]: code.data };
            setPayUrls(newUrls);
            updatePayQrValue(newUrls);
            toast.success("二维码识别成功！");
          } else {
            toast.error("未能识别二维码，请确保上传了清晰的收款码图片");
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    if (val === "url") setQrValue(urlInput || " ");
    else if (val === "text") setQrValue(textInput || " ");
    else if (val === "vcard") {
      const vcardString = `BEGIN:VCARD\nVERSION:3.0\nN:${vcard.lastName};${vcard.firstName}\nFN:${vcard.firstName} ${vcard.lastName}\nORG:${vcard.company}\nTITLE:${vcard.title}\nTEL:${vcard.phone}\nEMAIL:${vcard.email}\nURL:${vcard.website}\nEND:VCARD`;
      setQrValue(vcardString);
    } else if (val === "wifi") {
      const wifiString = `WIFI:T:${wifi.encryption};S:${wifi.ssid};P:${wifi.password};;`;
      setQrValue(wifiString);
    } else if (val === "pay") {
      updatePayQrValue(payUrls);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrlInput(e.target.value);
    setQrValue(e.target.value || " ");
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
    setQrValue(e.target.value || " ");
  };

  const handleVcardChange = (field: string, value: string) => {
    const newVcard = { ...vcard, [field]: value };
    setVcard(newVcard);
    
    const vcardString = `BEGIN:VCARD
VERSION:3.0
N:${newVcard.lastName};${newVcard.firstName}
FN:${newVcard.firstName} ${newVcard.lastName}
ORG:${newVcard.company}
TITLE:${newVcard.title}
TEL:${newVcard.phone}
EMAIL:${newVcard.email}
URL:${newVcard.website}
END:VCARD`;
    setQrValue(vcardString);
  };

  const handleWifiChange = (field: string, value: string) => {
    const newWifi = { ...wifi, [field]: value };
    setWifi(newWifi);
    
    const wifiString = `WIFI:T:${newWifi.encryption};S:${newWifi.ssid};P:${newWifi.password};;`;
    setQrValue(wifiString);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById("qr-canvas") as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      let downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = "qrcode.png";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  if (isPayRoute) {
    if (payEnv === "wechat" && payData.w) {
      return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4 transition-colors">
          <Card className="w-full max-w-sm p-8 space-y-6 text-center shadow-lg border-none flex flex-col items-center">
            <div className="font-bold text-2xl text-green-600 flex items-center justify-center gap-2">
              <Wallet className="w-7 h-7" /> 微信支付
            </div>
            <div className="p-3 bg-white rounded-xl shadow-sm border inline-block">
              <QRCodeSVG value={payData.w} size={220} />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-foreground">请长按上方二维码</p>
              <p className="text-sm text-muted-foreground">识别二维码进行付款</p>
            </div>
          </Card>
        </div>
      );
    }

    if (payEnv === "alipay" && payData.a) {
      return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4 transition-colors">
          <Card className="w-full max-w-sm p-8 space-y-6 text-center shadow-lg border-none flex flex-col items-center">
            <div className="font-bold text-2xl text-blue-500 flex items-center justify-center gap-2">
              <Wallet className="w-7 h-7" /> 支付宝
            </div>
            <div className="p-3 bg-white rounded-xl shadow-sm border inline-block">
              <QRCodeSVG value={payData.a} size={220} />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-foreground">正在唤起支付宝...</p>
              <p className="text-sm text-muted-foreground">如果没有自动跳转，请长按识别二维码或保存图片后在支付宝中打开</p>
            </div>
          </Card>
        </div>
      );
    }

    if (payEnv === "qq" && payData.q) {
      return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4 transition-colors">
          <Card className="w-full max-w-sm p-8 space-y-6 text-center shadow-lg border-none flex flex-col items-center">
            <div className="font-bold text-2xl text-red-500 flex items-center justify-center gap-2">
              <Wallet className="w-7 h-7" /> QQ钱包
            </div>
            <div className="p-3 bg-white rounded-xl shadow-sm border inline-block">
              <QRCodeSVG value={payData.q} size={220} />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-foreground">请长按上方二维码</p>
              <p className="text-sm text-muted-foreground">识别二维码进行付款</p>
            </div>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-muted/30 p-4 md:p-8 font-sans text-foreground flex flex-col items-center justify-center transition-colors">
        <Card className="w-full max-w-md p-6 space-y-6 text-center shadow-lg border-none">
          <h1 className="text-2xl font-bold tracking-tight">请使用对应的App扫码支付</h1>
          <p className="text-muted-foreground text-sm">检测到您正在普通浏览器中打开，请使用微信、支付宝或QQ扫描下方对应的二维码进行支付。</p>
          <div className="space-y-8 flex flex-col items-center mt-6">
            {payData.w && (
              <div className="space-y-3 flex flex-col items-center">
                <div className="font-semibold text-green-600 flex items-center gap-2">
                  <Wallet className="w-5 h-5" /> 微信支付
                </div>
                <div className="p-3 bg-white rounded-xl shadow-sm border">
                  <QRCodeSVG value={payData.w} size={180} />
                </div>
              </div>
            )}
            {payData.a && (
              <div className="space-y-3 flex flex-col items-center">
                <div className="font-semibold text-blue-500 flex items-center gap-2">
                  <Wallet className="w-5 h-5" /> 支付宝
                </div>
                <div className="p-3 bg-white rounded-xl shadow-sm border">
                  <QRCodeSVG value={payData.a} size={180} />
                </div>
              </div>
            )}
            {payData.q && (
              <div className="space-y-3 flex flex-col items-center">
                <div className="font-semibold text-red-500 flex items-center gap-2">
                  <Wallet className="w-5 h-5" /> QQ钱包
                </div>
                <div className="p-3 bg-white rounded-xl shadow-sm border">
                  <QRCodeSVG value={payData.q} size={180} />
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8 font-sans text-foreground transition-colors">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between pb-6 border-b">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">屿宁二维码生成器</h1>
            <p className="text-muted-foreground mt-1">轻松创建、自定义并下载二维码。支持多码合一收款码。</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <a href="https://github.com/wyn68/qr-code" target="_blank" rel="noopener noreferrer">
                <Github className="h-5 w-5" />
              </a>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsDark(!isDark)}>
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel: Inputs & Customization */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">内容</CardTitle>
                <CardDescription>选择二维码的内容类型。</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="grid grid-cols-5 mb-6">
                    <TabsTrigger value="url" className="flex items-center gap-2">
                      <Link className="w-4 h-4" /> <span className="hidden sm:inline">网址</span>
                    </TabsTrigger>
                    <TabsTrigger value="text" className="flex items-center gap-2">
                      <Type className="w-4 h-4" /> <span className="hidden sm:inline">文本</span>
                    </TabsTrigger>
                    <TabsTrigger value="vcard" className="flex items-center gap-2">
                      <Contact className="w-4 h-4" /> <span className="hidden sm:inline">名片</span>
                    </TabsTrigger>
                    <TabsTrigger value="wifi" className="flex items-center gap-2">
                      <Wifi className="w-4 h-4" /> <span className="hidden sm:inline">Wi-Fi</span>
                    </TabsTrigger>
                    <TabsTrigger value="pay" className="flex items-center gap-2">
                      <Wallet className="w-4 h-4" /> <span className="hidden sm:inline">收款</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="url" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="url">网址链接</Label>
                      <Input 
                        id="url" 
                        placeholder="https://example.com" 
                        value={urlInput}
                        onChange={handleUrlChange}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="text" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="text">纯文本</Label>
                      <Textarea 
                        id="text" 
                        placeholder="在此输入文本..." 
                        className="min-h-[120px]"
                        value={textInput}
                        onChange={handleTextChange}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="vcard" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="lastName">姓氏</Label>
                        <Input id="lastName" value={vcard.lastName} onChange={(e) => handleVcardChange("lastName", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="firstName">名字</Label>
                        <Input id="firstName" value={vcard.firstName} onChange={(e) => handleVcardChange("firstName", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">手机号码</Label>
                        <Input id="phone" type="tel" value={vcard.phone} onChange={(e) => handleVcardChange("phone", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">电子邮箱</Label>
                        <Input id="email" type="email" value={vcard.email} onChange={(e) => handleVcardChange("email", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">公司</Label>
                        <Input id="company" value={vcard.company} onChange={(e) => handleVcardChange("company", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="title">职位</Label>
                        <Input id="title" value={vcard.title} onChange={(e) => handleVcardChange("title", e.target.value)} />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="website">个人主页/网址</Label>
                        <Input id="website" type="url" value={vcard.website} onChange={(e) => handleVcardChange("website", e.target.value)} />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="wifi" className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="ssid">网络名称 (SSID)</Label>
                        <Input id="ssid" value={wifi.ssid} onChange={(e) => handleWifiChange("ssid", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">密码</Label>
                        <Input id="password" type="password" value={wifi.password} onChange={(e) => handleWifiChange("password", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="encryption">加密方式</Label>
                        <Select value={wifi.encryption} onValueChange={(val) => handleWifiChange("encryption", val)}>
                          <SelectTrigger>
                            <SelectValue placeholder="选择加密方式" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="WPA">WPA/WPA2/WPA3</SelectItem>
                            <SelectItem value="WEP">WEP</SelectItem>
                            <SelectItem value="nopass">无密码</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="pay" className="space-y-4">
                    <div className="space-y-4">
                      <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground mb-4">
                        上传您的微信、支付宝或QQ收款码图片，我们将为您生成一个“多码合一”的收款码。用户扫码时会自动跳转到对应的支付App。
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wechatPay" className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span> 微信收款码
                        </Label>
                        <div className="flex items-center gap-4">
                          <Input 
                            id="wechatPay" 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handlePayUpload(e, 'wechat')}
                            className="flex-1"
                          />
                          {payUrls.wechat && <span className="text-sm text-green-600 font-medium">已识别 ✓</span>}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="alipay" className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span> 支付宝收款码
                        </Label>
                        <div className="flex items-center gap-4">
                          <Input 
                            id="alipay" 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handlePayUpload(e, 'alipay')}
                            className="flex-1"
                          />
                          {payUrls.alipay && <span className="text-sm text-blue-600 font-medium">已识别 ✓</span>}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="qqPay" className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span> QQ收款码
                        </Label>
                        <div className="flex items-center gap-4">
                          <Input 
                            id="qqPay" 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handlePayUpload(e, 'qq')}
                            className="flex-1"
                          />
                          {payUrls.qq && <span className="text-sm text-red-600 font-medium">已识别 ✓</span>}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Palette className="w-5 h-5" /> 自定义设置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>前景色 (图案颜色)</Label>
                      <div className="flex gap-2">
                        <Input 
                          type="color" 
                          value={fgColor} 
                          onChange={(e) => setFgColor(e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input 
                          type="text" 
                          value={fgColor} 
                          onChange={(e) => setFgColor(e.target.value)}
                          className="flex-1 uppercase font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>背景色</Label>
                      <div className="flex gap-2">
                        <Input 
                          type="color" 
                          value={bgColor} 
                          onChange={(e) => setBgColor(e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input 
                          type="text" 
                          value={bgColor} 
                          onChange={(e) => setBgColor(e.target.value)}
                          className="flex-1 uppercase font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex justify-between">
                        <span>边距 (白边)</span>
                        <span className="text-muted-foreground">{margin}</span>
                      </Label>
                      <Slider 
                        value={marginValue} 
                        min={0} 
                        max={10} 
                        step={1} 
                        onValueChange={(val: any) => setMargin(Array.isArray(val) ? val[0] : val)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>容错率</Label>
                      <Select value={errorCorrection} onValueChange={(val: any) => setErrorCorrection(val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择容错率" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="L">低 (7%)</SelectItem>
                          <SelectItem value="M">中 (15%)</SelectItem>
                          <SelectItem value="Q">较高 (25%)</SelectItem>
                          <SelectItem value="H">高 (30%)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        容错率越高，二维码在被部分遮挡或损坏时越容易被识别。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-4">
                  <div className="space-y-2">
                    <Label>Logo 图片 (可选)</Label>
                    <div className="flex items-center gap-4">
                      <Input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoUpload}
                        className="flex-1"
                      />
                      {logoUrl && (
                        <Button variant="outline" onClick={() => setLogoUrl("")}>
                          清除
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {logoUrl && (
                    <div className="space-y-2">
                      <Label className="flex justify-between">
                        <span>Logo 大小</span>
                        <span className="text-muted-foreground">{Math.round(logoSize * 100)}%</span>
                      </Label>
                      <Slider 
                        value={logoSizeValue} 
                        min={0.1} 
                        max={0.4} 
                        step={0.01} 
                        onValueChange={(val: any) => setLogoSize(Array.isArray(val) ? val[0] : val)} 
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Preview & Download */}
          <div className="space-y-6">
            <Card className="border-none shadow-sm sticky top-6">
              <CardHeader className="pb-4 text-center">
                <CardTitle className="text-lg">预览</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-6">
                <div 
                  className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-center transition-all duration-300"
                  style={{ backgroundColor: bgColor }}
                >
                  <QRCodeCanvas
                    id="qr-canvas"
                    value={qrValue || " "}
                    size={1024}
                    style={{ width: size, height: size }}
                    fgColor={fgColor}
                    bgColor={bgColor}
                    level={errorCorrection}
                    marginSize={margin}
                    imageSettings={logoUrl ? {
                      src: logoUrl,
                      height: 1024 * logoSize,
                      width: 1024 * logoSize,
                      excavate: true,
                    } : undefined}
                  />
                </div>

                <div className="w-full space-y-3">
                  <Button 
                    className="w-full flex items-center gap-2" 
                    size="lg"
                    onClick={downloadQRCode}
                  >
                    <Download className="w-5 h-5" /> 下载 PNG
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    下载前请先扫码测试。
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
