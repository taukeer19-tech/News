export default function SmtpPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">SMTP Configurations</h1>
        <button className="glass-button bg-blue-600/10 text-blue-700 border-blue-500/20 font-medium">
          + Add SMTP Server
        </button>
      </div>

      <div className="space-y-6">
        {[
          { name: "SendGrid Main API", host: "smtp.sendgrid.net", port: 587, status: "Active" },
          { name: "AWS SES Marketing", host: "email-smtp.us-east-1.amazonaws.com", port: 465, status: "Active" },
          { name: "Mailtrap Testing", host: "sandbox.smtp.mailtrap.io", port: 2525, status: "Inactive" },
        ].map((smtp, i) => (
          <div key={i} className="glass-panel p-6 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="font-bold text-lg text-gray-800">{smtp.name}</h3>
                {smtp.status === 'Active' ? (
                  <span className="px-2 py-0.5 bg-green-100/50 text-green-700 text-xs font-medium rounded-full border border-green-200/50">Active</span>
                ) : (
                  <span className="px-2 py-0.5 bg-gray-100/50 text-gray-600 text-xs font-medium rounded-full border border-gray-200/50">Inactive</span>
                )}
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Host:</strong> {smtp.host}</p>
                <p><strong>Port:</strong> {smtp.port} &nbsp;&nbsp; <strong>Encryption:</strong> TLS</p>
                <p><strong>Sender:</strong> marketing@mycompany.com</p>
              </div>
            </div>
            
            <div className="flex md:flex-col space-x-3 md:space-x-0 md:space-y-2 w-full md:w-auto">
              <button className="flex-1 glass-button text-sm text-green-700 border-green-300">Test Connection</button>
              <button className="flex-1 glass-button text-sm">Edit Settings</button>
              <button className="flex-1 glass-button text-sm text-red-600 border-red-200">Delete</button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Settings Form Mock */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-6">General Email Settings</h2>
        <div className="glass-panel p-6">
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="glass-label">Default 'From' Name</label>
                <input type="text" className="glass-input" defaultValue="My Company Marketing" />
              </div>
              <div>
                <label className="glass-label">Default 'From' Email</label>
                <input type="email" className="glass-input" defaultValue="hello@mycompany.com" />
              </div>
            </div>

            <div className="border-t border-white/20 pt-6">
              <h3 className="font-semibold text-gray-800 mb-4">Bounce Detection</h3>
              <div>
                <label className="glass-label">Return-Path / Bounce Webhook URL</label>
                <div className="flex">
                  <input type="text" className="glass-input rounded-r-none bg-gray-50/30 text-gray-500" readOnly value="https://app.mycompany.com/api/webhooks/bounce" />
                  <button type="button" className="glass-button rounded-l-none border-l-0">Copy</button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Configure this URL in your SMTP provider (SendGrid, Mailgun) to automatically handle bounces.</p>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button type="button" className="glass-button bg-blue-600/10 text-blue-700 font-bold border-blue-500/20 px-8">Save Preferences</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
