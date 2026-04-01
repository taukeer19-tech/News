"use client";

import { useEffect, useState, useRef } from "react";
import { FileText, PlusCircle, Trash2, Edit2, LayoutTemplate, Loader2, Image as ImageIcon, Bold, Italic, Strikethrough, List, ListOrdered, Eye, Send, X, Underline, AlignLeft, AlignCenter, AlignRight, Code, Link as LinkIcon, Undo, Redo } from "lucide-react";

type Template = {
  id: string;
  name: string;
  subject: string;
  contentHtml: string;
  createdAt: string;
};

// Correct Bombino Express HTML template matching the new layout
const BOMBINO_DEFAULT_HTML = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta charset="UTF-8">
  <meta content="width=device-width, initial-scale=1" name="viewport">
  <title>Bombino Express</title>
</head>
<body style="width:100%;height:100%;font-family:arial,'helvetica neue',helvetica,sans-serif;padding:0;margin:0;background-color:#F6F6F6">
  <div style="background-color:#F6F6F6">
    <table width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-spacing:0;padding:0;margin:0">
      <tr>
        <td valign="top" style="padding:0;margin:0">

          <!-- HEADER: Logo -->
          <table cellspacing="0" cellpadding="0" align="center" style="width:100%;border-spacing:0;background-color:transparent">
            <tr>
              <td align="center" style="padding:0;margin:0">
                <table cellspacing="0" cellpadding="0" align="center" style="border-spacing:0;background-color:#FFFFFF;width:600px">
                  <tr>
                    <td align="left" style="padding:20px 20px 0;margin:0">
                      <table cellspacing="0" cellpadding="0" align="left" style="border-spacing:0;float:left">
                        <tr>
                          <td valign="top" align="center" style="padding:0;margin:0;width:560px">
                            <table width="100%" cellspacing="0" cellpadding="0" style="border-spacing:0">
                              <tr>
                                <td align="center" style="padding:0;margin:0;font-size:0">
                                  <a target="_blank" href="https://www.bombinoexp.com" style="text-decoration:none;color:#1376C8;font-size:14px">
                                    <img src="https://fyrptjy.stripocdn.email/content/guids/CABINET_e77334dc9b7a99972af7127fbf474f9ef41e8a3dc909c3a7e9d86f162965e37d/images/bombino_express_pvt_ltd_logo_2.PNG"
                                         width="160"
                                         style="display:block;font-size:14px;border:0;outline:none;text-decoration:none;margin:0;max-width:160px;height:auto"
                                         alt="Bombino Express">
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- BODY: Email Content -->
          <table cellspacing="0" cellpadding="0" align="center" style="width:100%;border-spacing:0">
            <tr>
              <td align="center" style="padding:0;margin:0">
                <table cellspacing="0" cellpadding="0" align="center" style="border-spacing:0;background-color:#FFFFFF;width:600px">
                  <tr>
                    <td align="left" style="padding:20px 30px 30px;margin:0">
                      <table width="100%" cellspacing="0" cellpadding="0" style="border-spacing:0">
                        <tr>
                          <td valign="top" align="left" style="padding:0;margin:0;width:540px">
                            <table width="100%" cellspacing="0" cellpadding="0" style="border-spacing:0">
                              <tr>
                                <td align="left" style="padding:0;margin:0">
                                  <p style="margin:0 0 16px;font-family:arial,'helvetica neue',helvetica,sans-serif;line-height:21px;color:#333333;font-size:14px">
                                    Dear Valued Customer,
                                  </p>
                                  <p style="margin:0 0 16px;font-family:arial,'helvetica neue',helvetica,sans-serif;line-height:21px;color:#333333;font-size:14px">
                                    Write your message here.
                                  </p>
                                  <p style="margin:0;font-family:arial,'helvetica neue',helvetica,sans-serif;line-height:21px;color:#333333;font-size:14px">
                                    Warm regards,<br>
                                    <strong>Bombino Express Team</strong>
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- FOOTER: Company Info + Social -->
          <table cellspacing="0" cellpadding="0" align="center" style="width:100%;border-spacing:0">
            <tr>
              <td align="center" style="padding:0;margin:0">
                <table cellspacing="0" cellpadding="0" align="center" style="border-spacing:0;background-color:#FFFFFF;width:600px">
                  <tr>
                    <td align="left" style="padding:20px 20px 0;margin:0">
                      <table width="100%" cellspacing="0" cellpadding="0" style="border-spacing:0">
                        <tr>
                          <td valign="top" align="center" style="padding:0;margin:0;width:560px">
                            <table width="100%" cellspacing="0" cellpadding="0" style="border-spacing:0">

                              <!-- Truck Banner Image -->
                              <tr>
                                <td align="center" style="padding:0;margin:0;font-size:0">
                                  <img src="https://fyrptjy.stripocdn.email/content/guids/CABINET_e77334dc9b7a99972af7127fbf474f9ef41e8a3dc909c3a7e9d86f162965e37d/images/unnamed.gif"
                                       width="540"
                                       style="display:block;font-size:14px;border:0;outline:none;text-decoration:none;margin:0;max-width:100%;height:auto"
                                       alt="">
                                </td>
                              </tr>

                              <!-- Company Info -->
                              <tr>
                                <td align="center" style="padding:12px 0 0;margin:0">
                                  <p style="margin:0;font-family:arial,'helvetica neue',helvetica,sans-serif;line-height:21px;color:#333333;font-size:14px;text-align:center">
                                    <strong>BOMBINO EXPRESS PVT LTD</strong>
                                  </p>
                                  <p style="margin:0;font-family:arial,'helvetica neue',helvetica,sans-serif;line-height:21px;color:#333333;font-size:14px;text-align:center">
                                    Corporate Centre B, 1 &amp; 2, Ground Floor,&nbsp;
                                  </p>
                                  <p style="margin:0;font-family:arial,'helvetica neue',helvetica,sans-serif;line-height:21px;color:#333333;font-size:14px;text-align:center">
                                    Marol Pipe Line, Andheri Kurla Road, Mumbai - 400059
                                  </p>
                                  <p style="margin:0;font-family:arial,'helvetica neue',helvetica,sans-serif;line-height:21px;color:#333333;font-size:14px;text-align:center">
                                    Toll Fee: <a href="tel:18002666401" style="text-decoration:none;color:#1376C8;font-size:14px">18002666401</a>
                                    &nbsp;| &nbsp;Phone:&nbsp;
                                    <a href="tel:02266400000" style="text-decoration:none;color:#1376C8;font-size:14px">022 66400000</a>
                                  </p>
                                  <p style="margin:0">&nbsp;</p>
                                </td>
                              </tr>

                              <!-- Social Icons -->
                              <tr>
                                <td align="center" style="padding:0;margin:0;font-size:0">
                                  <table cellpadding="0" cellspacing="0" style="border-spacing:0">
                                    <tr>
                                      <td align="center" valign="top" style="padding:0 7px 0 0;margin:0">
                                        <a target="_blank" href="https://www.facebook.com/BombinoExp?ref=hl" style="text-decoration:underline;color:#1376C8;font-size:14px">
                                          <img title="Facebook" src="https://fyrptjy.stripocdn.email/content/assets/img/social-icons/circle-black/facebook-circle-black.png" alt="Fb" width="32" height="32" style="display:block;font-size:14px;border:0;outline:none;text-decoration:none;margin:0">
                                        </a>
                                      </td>
                                      <td align="center" valign="top" style="padding:0 7px 0 0;margin:0">
                                        <a target="_blank" href="https://www.instagram.com/bombinoexpress/" style="text-decoration:underline;color:#1376C8;font-size:14px">
                                          <img title="Instagram" src="https://fyrptjy.stripocdn.email/content/assets/img/social-icons/circle-black/instagram-circle-black.png" alt="Ig" width="32" height="32" style="display:block;font-size:14px;border:0;outline:none;text-decoration:none;margin:0">
                                        </a>
                                      </td>
                                      <td align="center" valign="top" style="padding:0 10px 0 0;margin:0">
                                        <a target="_blank" href="https://www.linkedin.com/company/bombino-express-pvt-ltd/" style="text-decoration:underline;color:#1376C8;font-size:14px">
                                          <img title="LinkedIn" src="https://fyrptjy.stripocdn.email/content/assets/img/social-icons/circle-black/linkedin-circle-black.png" alt="In" width="32" height="32" style="display:block;font-size:14px;border:0;outline:none;text-decoration:none;margin:0">
                                        </a>
                                      </td>
                                      <td align="center" valign="top" style="padding:0 10px 0 0;margin:0">
                                        <a target="_blank" href="https://api.whatsapp.com/send?phone=917045999553" style="text-decoration:underline;color:#1376C8;font-size:14px">
                                          <img title="Whatsapp" src="https://fyrptjy.stripocdn.email/content/assets/img/messenger-icons/circle-black/whatsapp-circle-black.png" alt="Whatsapp" width="32" height="32" style="display:block;font-size:14px;border:0;outline:none;text-decoration:none;margin:0">
                                        </a>
                                      </td>
                                      <td align="center" valign="top" style="padding:0 10px 0 0;margin:0">
                                        <a target="_blank" href="mailto:info@bombinoexp.com" style="text-decoration:underline;color:#1376C8;font-size:14px">
                                          <img title="Email" src="https://fyrptjy.stripocdn.email/content/assets/img/other-icons/circle-black/mail-circle-black.png" alt="Email" width="32" height="32" style="display:block;font-size:14px;border:0;outline:none;text-decoration:none;margin:0">
                                        </a>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>

                              <!-- Bottom spacing -->
                              <tr>
                                <td style="padding:0 0 20px;margin:0">&nbsp;</td>
                              </tr>

                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;

function ToolbarBtn({ onClick, title, children, disabled }: { onClick: () => void; title: string; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} title={title} disabled={disabled}
      className={`w-8 h-8 flex items-center justify-center rounded transition-all text-sm font-bold ${disabled ? "opacity-30 cursor-not-allowed" : "hover:bg-white/10 text-white/50 hover:text-white"}`}>
      {children}
    </button>
  );
}

function RichEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<"editor" | "preview" | "source">("editor");
  const [uploading, setUploading] = useState(false);

  const exec = (cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const insertLink = () => {
    const url = prompt("Enter URL:", "https://");
    if (url) exec("createLink", url);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const d = await res.json();
        const absoluteUrl = `${window.location.origin}${d.url}`;
        exec("insertImage", absoluteUrl);
      } else {
        alert("Failed to upload image.");
      }
    } catch (err) {
      alert("Error uploading image");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  useEffect(() => {
    if (tab === "editor" && editorRef.current && editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
    }
  }, [tab, value]);

  return (
    <div className="flex flex-col flex-1 h-full min-h-[500px]">
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-3 bg-black/50 border border-white/10 rounded-xl p-1 w-fit">
        {(["editor", "preview", "source"] as const).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${tab === t ? "bg-purple-500 text-white shadow-lg" : "text-white/40 hover:text-white"}`}>
            {t === "preview" && <Eye className="w-3.5 h-3.5" />}
            {t === "source" && "Raw HTML"}
            {t === "editor" && "Visual Editor"}
            {t === "preview" && "Preview"}
          </button>
        ))}
      </div>

      <div className="border border-white/10 rounded-xl overflow-hidden bg-[#1e1e2d] flex-1 flex flex-col min-h-[450px]">
        {tab === "editor" && (
          <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-white/5 flex-wrap bg-black/60 shrink-0">
              <ToolbarBtn onClick={() => exec("bold")} title="Bold"><Bold className="w-4 h-4" /></ToolbarBtn>
              <ToolbarBtn onClick={() => exec("italic")} title="Italic"><Italic className="w-4 h-4" /></ToolbarBtn>
              <ToolbarBtn onClick={() => exec("underline")} title="Underline"><Underline className="w-4 h-4" /></ToolbarBtn>
              <ToolbarBtn onClick={() => exec("strikeThrough")} title="Strikethrough"><Strikethrough className="w-4 h-4" /></ToolbarBtn>
              <div className="w-px h-5 bg-white/10 mx-1" />
              <ToolbarBtn onClick={() => exec("formatBlock", "h1")} title="Heading 1"><span className="text-xs font-black">H1</span></ToolbarBtn>
              <ToolbarBtn onClick={() => exec("formatBlock", "h2")} title="Heading 2"><span className="text-xs font-black">H2</span></ToolbarBtn>
              <div className="w-px h-5 bg-white/10 mx-1" />
              <ToolbarBtn onClick={() => exec("justifyLeft")} title="Align Left"><AlignLeft className="w-4 h-4" /></ToolbarBtn>
              <ToolbarBtn onClick={() => exec("justifyCenter")} title="Align Center"><AlignCenter className="w-4 h-4" /></ToolbarBtn>
              <ToolbarBtn onClick={() => exec("justifyRight")} title="Align Right"><AlignRight className="w-4 h-4" /></ToolbarBtn>
              <div className="w-px h-5 bg-white/10 mx-1" />
              <ToolbarBtn onClick={() => exec("insertUnorderedList")} title="Bullet List"><List className="w-4 h-4" /></ToolbarBtn>
              <ToolbarBtn onClick={() => exec("insertOrderedList")} title="Numbered List"><ListOrdered className="w-4 h-4" /></ToolbarBtn>
              <ToolbarBtn onClick={() => exec("formatBlock", "pre")} title="Code Block"><Code className="w-4 h-4" /></ToolbarBtn>
              <div className="w-px h-5 bg-white/10 mx-1" />
              <ToolbarBtn onClick={insertLink} title="Insert Link"><LinkIcon className="w-4 h-4" /></ToolbarBtn>
              
              <div className="relative">
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="absolute inset-0 w-8 h-8 opacity-0 cursor-pointer text-[0]" title="Upload Image" />
                <ToolbarBtn onClick={() => {}} title="Upload Image" disabled={uploading}>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin text-purple-400" /> : <ImageIcon className="w-4 h-4" />}
                </ToolbarBtn>
              </div>

              <div className="w-px h-5 bg-white/10 mx-1" />
              <ToolbarBtn onClick={() => exec("undo")} title="Undo"><Undo className="w-4 h-4" /></ToolbarBtn>
              <ToolbarBtn onClick={() => exec("redo")} title="Redo"><Redo className="w-4 h-4" /></ToolbarBtn>
            </div>
            {/* Content editable */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onBlur={() => { if (editorRef.current) onChange(editorRef.current.innerHTML); }}
              dangerouslySetInnerHTML={{ __html: value }}
              className="flex-1 p-8 text-black text-sm focus:outline-none leading-relaxed bg-white overflow-y-auto"
              style={{ caretColor: "black" }}
            />
          </div>
        )}

        {tab === "preview" && (
          <div className="flex-1 overflow-hidden bg-[#F6F6F6] flex flex-col">
            <iframe srcDoc={value} className="w-full flex-1 border-none" />
          </div>
        )}

        {tab === "source" && (
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            className="flex-1 w-full h-full p-5 bg-[#0F172A] text-emerald-400 font-mono text-xs focus:outline-none resize-none leading-relaxed custom-scrollbar shadow-inner"
            spellCheck={false}
          />
        )}
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [testEmailTemplate, setTestEmailTemplate] = useState<Template | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState("taukeer@bombinoexp.com");
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success?: string; error?: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [rawHtml, setRawHtml] = useState("");

  const fetchTemplates = async () => {
    setLoading(true);
    const res = await fetch(`/api/templates?_t=${Date.now()}`);
    if (res.ok) setTemplates(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); }, []);

  const openForm = (template?: Template) => {
    if (template) {
      setEditId(template.id);
      setName(template.name);
      setSubject(template.subject);
      setRawHtml(template.contentHtml);
    } else {
      setEditId(null);
      setName("");
      setSubject("Greetings from Bombino Express");
      setRawHtml(BOMBINO_DEFAULT_HTML);
    }
    setShowModal(true);
  };

  const handleHtmlUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        setRawHtml(content);
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset input so the same file can be uploaded again if needed
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const contentHtml = rawHtml;

    if (!contentHtml || contentHtml === '<p></p>') {
      alert("Template content cannot be empty.");
      return;
    }

    const url = editId ? `/api/templates/${editId}` : "/api/templates";
    const method = editId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, subject, contentHtml }),
    });

    if (res.ok) {
      setShowModal(false);
      fetchTemplates();
    } else {
      alert("Failed to save template.");
    }
  };

  const deleteTemplate = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async (id: string) => {
    setDeleteConfirmId(null);
    setTemplates(prev => prev.filter(t => t.id !== id));
    const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Failed to delete template");
      fetchTemplates(); // revert
    }
  };

  const sendTestEmail = async () => {
    if (!testEmailTemplate || !testEmailAddress) return;
    setTestEmailSending(true);
    setTestEmailResult(null);
    try {
      const res = await fetch("/api/templates/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: testEmailTemplate.id,
          toEmail: testEmailAddress,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestEmailResult({ success: data.message || "Test email sent successfully!" });
      } else {
        setTestEmailResult({ error: data.error || "Failed to send test email." });
      }
    } catch (err: any) {
      setTestEmailResult({ error: err.message || "Network error." });
    } finally {
      setTestEmailSending(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
            <LayoutTemplate className="w-10 h-10" />
            Email Templates
          </h1>
          <p className="text-white/70 mt-2 text-lg">Design and manage your reusable email content.</p>
        </div>
        <button
          onClick={() => openForm()}
          className="bg-purple-500 hover:bg-purple-600 text-white border border-purple-400/30 px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20 backdrop-blur-md font-semibold"
        >
          <PlusCircle className="w-5 h-5" /> New Template
        </button>
      </div>

      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
        {loading ? (
          <div className="text-center text-white/50 py-20 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            Loading templates...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(template => (
              <div key={template.id} className="bg-gradient-to-br from-black/40 to-black/20 hover:from-black/50 hover:to-black/30 border border-white/10 rounded-3xl p-6 transition-all group relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/5 text-purple-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex gap-1">
                    {/* Preview */}
                    <button
                      onClick={() => setPreviewTemplate(template)}
                      className="p-2 text-emerald-400 hover:bg-white/10 rounded-xl transition-all"
                      title="Preview Template"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {/* Test Send */}
                    <button
                      onClick={() => { setTestEmailTemplate(template); setTestEmailResult(null); }}
                      className="p-2 text-blue-400 hover:bg-white/10 rounded-xl transition-all"
                      title="Send Test Email"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                    {/* Edit */}
                    <button onClick={() => openForm(template)} className="p-2 text-indigo-300 hover:bg-white/10 rounded-xl transition-all" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {/* Delete */}
                    <button onClick={() => deleteTemplate(template.id)} className="p-2 text-red-400 hover:bg-white/10 rounded-xl transition-all" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-white mb-1 truncate" title={template.name}>{template.name}</h3>
                  <p className="text-white/50 text-sm mb-4 truncate" title={template.subject}>Subj: {template.subject}</p>
                  <div className="text-xs text-white/30 font-mono bg-black/40 px-3 py-2 rounded-lg truncate border border-white/5">
                    Added: {new Date(template.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
            {templates.length === 0 && (
              <div className="col-span-full text-center py-12 text-white/50 border border-white/5 border-dashed rounded-2xl bg-black/20">
                No templates found. Let's create your first email design!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)}></div>
          <div className="relative w-full max-w-sm bg-gray-900 border border-purple-500/20 rounded-2xl p-6 shadow-2xl z-10 transition-all">
            <h3 className="text-xl font-bold text-white mb-2 text-left">Delete Template</h3>
            <p className="text-white/70 text-sm mb-8 leading-relaxed text-left">Are you sure you want to permanently delete this template? This cannot be undone.</p>
            <div className="flex gap-4 justify-end">
              <button onClick={() => setDeleteConfirmId(null)} className="px-5 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all font-medium">Cancel</button>
              <button onClick={() => confirmDelete(deleteConfirmId)} className="px-5 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all font-medium font-bold">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── PREVIEW MODAL ── */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setPreviewTemplate(null)} />
          <div className="relative bg-[#1A1A2E]/95 backdrop-blur-xl border border-white/20 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl shadow-purple-900/40 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold text-white">{previewTemplate.name}</h2>
                <p className="text-white/50 text-sm">Subject: {previewTemplate.subject}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setTestEmailTemplate(previewTemplate); setPreviewTemplate(null); setTestEmailResult(null); }}
                  className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 px-4 py-2 rounded-xl transition-all text-sm font-medium"
                >
                  <Send className="w-4 h-4" /> Send Test
                </button>
                <button onClick={() => setPreviewTemplate(null)} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-gray-100 m-4 rounded-2xl">
              <iframe
                srcDoc={previewTemplate.contentHtml}
                className="w-full h-full rounded-2xl"
                style={{ minHeight: '580px', border: 'none' }}
                title="Email Preview"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── TEST EMAIL MODAL ── */}
      {testEmailTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setTestEmailTemplate(null)} />
          <div className="relative bg-[#1A1A2E]/95 backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-blue-900/40">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-400" /> Send Test Email
              </h2>
              <button onClick={() => setTestEmailTemplate(null)} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-5">
              <p className="text-white/50 text-xs uppercase tracking-wider font-medium mb-1">Template</p>
              <p className="text-white font-semibold">{testEmailTemplate.name}</p>
              <p className="text-white/50 text-sm">Subject: {testEmailTemplate.subject}</p>
            </div>

            <div className="mb-5">
              <label className="block text-white/70 text-sm font-medium mb-2">Send Test To *</label>
              <input
                type="email"
                value={testEmailAddress}
                onChange={e => setTestEmailAddress(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="email@example.com"
              />
            </div>

            {testEmailResult && (
              <div className={`rounded-xl px-4 py-3 mb-5 text-sm font-medium ${testEmailResult.success ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300' : 'bg-red-500/20 border border-red-500/30 text-red-300'}`}>
                {testEmailResult.success || testEmailResult.error}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setTestEmailTemplate(null)} className="px-5 py-2.5 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all">Cancel</button>
              <button
                onClick={sendTestEmail}
                disabled={testEmailSending || !testEmailAddress}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20"
              >
                {testEmailSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {testEmailSending ? 'Sending…' : 'Send Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DESIGN / EDIT MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="relative bg-[#0F172A] border border-white/10 rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-white/5 bg-white/5 flex items-center justify-between shrink-0">
               <div>
                 <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                   <LayoutTemplate className="w-6 h-6 text-purple-400" />
                   {editId ? 'Edit Template Design' : 'Create New Template'}
                 </h2>
                 <p className="text-white/50 text-sm mt-1">Design a reusable layout for your future campaigns.</p>
               </div>
               <button onClick={() => setShowModal(false)} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                  <X className="w-5 h-5" />
               </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <form id="template-form" onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/5 p-6 rounded-2xl border border-white/5">
                  <div className="col-span-1">
                    <label className="block text-white/70 text-sm font-semibold mb-2">Internal Name *</label>
                    <input required type="text" value={name} onChange={e => setName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium placeholder:text-white/20"
                      placeholder="e.g., Weekly Newsletter Template" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-white/70 text-sm font-semibold mb-2">Default Subject Line *</label>
                    <input required type="text" value={subject} onChange={e => setSubject(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium placeholder:text-white/20"
                      placeholder="e.g., You've got exciting news from Bombino Express!" />
                  </div>
                </div>

                <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col h-full min-h-[500px]">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                    <div>
                      <label className="block text-white/90 text-sm font-bold tracking-wide uppercase">Template Canvas</label>
                      <p className="text-white/40 text-xs mt-1">Write your content manually or upload a pre-designed HTML file.</p>
                    </div>

                    <div className="flex items-center gap-3">
                      
                      {/* Upload HTML Option */}
                      <div className="relative">
                        <input type="file" accept=".html,.htm" onChange={handleHtmlUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-[0]" title="Upload HTML File" />
                        <div className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer pointer-events-none">
                           <LayoutTemplate className="w-4 h-4" /> Upload .HTML File
                        </div>
                      </div>

                  </div>
                </div>

                <div className="flex-1 flex flex-col min-h-[400px] mt-4">
                  <RichEditor value={rawHtml} onChange={setRawHtml} />
                </div>
                </div>

              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-5 border-t border-white/5 bg-black/20 flex gap-3 justify-end items-center shrink-0">
              <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 text-white/50 hover:text-white font-semibold transition-all">Cancel</button>
              <button form="template-form" type="submit" className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-8 py-2.5 rounded-xl transition-all font-bold shadow-xl shadow-purple-500/20 text-sm tracking-wide">
                Save Layout
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
