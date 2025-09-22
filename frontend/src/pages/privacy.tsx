import { NavigationHeader } from "@/components/NavigationHeader";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50">
      <NavigationHeader />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Information We Collect</h2>
              <p className="text-slate-700 mb-4">
                We collect information you provide directly to us, such as when you create an account, 
                use our services, or contact us for support.
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2">
                <li>Account information (email address, profile information)</li>
                <li>Project and campaign data you create and manage</li>
                <li>Usage information and analytics</li>
                <li>Communication records when you contact us</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">How We Use Your Information</h2>
              <p className="text-slate-700 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and manage your account</li>
                <li>Send you technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Analyze usage patterns to improve user experience</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Information Sharing</h2>
              <p className="text-slate-700 mb-4">
                We do not sell, trade, or otherwise transfer your personal information to third parties, 
                except in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and prevent fraud</li>
                <li>With service providers who assist in our operations (under strict confidentiality agreements)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Data Security</h2>
              <p className="text-slate-700 mb-4">
                We implement appropriate technical and organizational measures to protect your personal 
                information against unauthorized access, alteration, disclosure, or destruction.
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2">
                <li>Encrypted data transmission using HTTPS</li>
                <li>Secure database storage with access controls</li>
                <li>Regular security audits and updates</li>
                <li>Limited employee access on a need-to-know basis</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Your Rights</h2>
              <p className="text-slate-700 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2">
                <li>Access and review your personal information</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Delete your account and associated data</li>
                <li>Export your data in a portable format</li>
                <li>Opt out of non-essential communications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Cookies and Tracking</h2>
              <p className="text-slate-700 mb-4">
                We use cookies and similar technologies to enhance your experience, analyze usage, 
                and maintain your session. You can control cookie settings through your browser preferences.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Data Retention</h2>
              <p className="text-slate-700 mb-4">
                We retain your information for as long as your account is active or as needed to 
                provide services. We may retain certain information for legitimate business purposes 
                or legal compliance even after account deletion.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Children's Privacy</h2>
              <p className="text-slate-700 mb-4">
                Our services are not intended for children under 13 years of age. We do not 
                knowingly collect personal information from children under 13.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Changes to This Policy</h2>
              <p className="text-slate-700 mb-4">
                We may update this privacy policy from time to time. We will notify you of any 
                material changes by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Contact Us</h2>
              <p className="text-slate-700 mb-4">
                If you have any questions about this privacy policy or our privacy practices, 
                please contact us at:
              </p>
              <div className="bg-slate-100 p-4 rounded-md">
                <p className="text-slate-700">
                  <strong>Company:</strong> Traffid AI Ltd<br />
                  <strong>Email:</strong> privacy@traffid.ai<br />
                  <strong>Address:</strong> Dubai International Financial Centre (DIFC)<br />
                  Gate Avenue, Zone D<br />
                  Dubai, UAE
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}