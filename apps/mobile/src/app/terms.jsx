import { View, TouchableOpacity, Text, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { WebView } from "react-native-webview";

const TERMS_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin: 0; padding: 16px; font-family: Arial, sans-serif; background: #fff; color: #333; line-height: 1.6; }
  h1 { font-size: 22px; color: #000; margin-top: 32px; margin-bottom: 6px; }
  h2 { font-size: 16px; color: #000; margin-top: 20px; margin-bottom: 4px; }
  .title { font-size: 26px; margin-top: 0; }
  .subtitle { font-size: 13px; color: #888; margin-top: 0; margin-bottom: 4px; }
  .updated { font-size: 13px; color: #888; margin-bottom: 24px; }
  p { font-size: 14px; color: #595959; margin-bottom: 12px; }
  ul { padding-left: 20px; }
  li { font-size: 14px; color: #595959; margin-bottom: 6px; }
  a { color: #3030F1; word-break: break-word; }
  .footer { font-size: 12px; color: #aaa; text-align: center; margin-top: 48px; padding-bottom: 24px; }
  .warning { background: #fff8f0; border-left: 4px solid #f9a35e; padding: 12px 16px; border-radius: 4px; margin-bottom: 12px; }
  .warning p { margin: 0; }
</style>
</head>
<body>
  <h1 class="title">Drift — Terms &amp; Conditions</h1>
  <p class="subtitle">Drift Journal | iOS</p>
  <p class="updated">Last Updated: April 8, 2026</p>

  <h1>1. General Terms</h1>
  <p>By downloading, installing, or using the Drift app, you confirm that you are in agreement with and bound by the Terms &amp; Conditions outlined in this document. These terms apply to the Drift app, its website, and any communication between you and Drift.</p>
  <p>Under no circumstances shall Drift or its team be liable for any direct, indirect, special, incidental, or consequential damages arising out of the use of, or inability to use, the app or its materials — even if Drift or an authorized representative has been advised of the possibility of such damages.</p>
  <p>Drift reserves the right to change prices and revise its resources usage policy at any time.</p>

  <h1>2. Apple App Store Terms</h1>
  <p>Drift is distributed through the Apple App Store. The following terms apply in addition to all other provisions of this Agreement:</p>
  <ul>
    <li>This Agreement is between you and Drift only — not with Apple Inc. Apple is not responsible for the app or its content.</li>
    <li>Apple has no obligation to provide any maintenance or support services for Drift.</li>
    <li>In the event that Drift fails to conform to any applicable warranty, you may notify Apple, and Apple will refund the purchase price for the app (if any) to you. To the maximum extent permitted by applicable law, Apple will have no other warranty obligation with respect to Drift.</li>
    <li>Apple is not responsible for addressing any claims by you or any third party relating to Drift or your possession or use of Drift, including product liability claims, consumer protection claims, intellectual property claims, or legal and regulatory compliance.</li>
    <li>Apple and Apple's subsidiaries are third-party beneficiaries of this Agreement. Upon your acceptance of this Agreement, Apple will have the right to enforce this Agreement against you as a third-party beneficiary.</li>
    <li>You must comply with applicable third-party terms of service when using Drift (e.g., your wireless data agreement).</li>
  </ul>

  <h1>3. Eligibility and Age Requirements</h1>
  <p>Drift is intended for users who are 18 years of age or older. By using the app, you represent and warrant that you meet this age requirement.</p>
  <p>If you are under 18, you must have your parent or legal guardian's permission to use the app. If you are under 13, you are not permitted to use Drift under any circumstances, in compliance with the Children's Online Privacy Protection Act (COPPA).</p>
  <p>By using Drift, you represent that you have the legal capacity to enter into a binding agreement.</p>

  <h1>4. License</h1>
  <p>Drift grants you a revocable, non-exclusive, non-transferable, limited license to download, install, and use the app strictly in accordance with the terms of this Agreement. This license is for personal, non-commercial use only.</p>
  <p>You agree not to, and will not permit others to:</p>
  <ul>
    <li>License, sell, rent, lease, assign, distribute, transmit, host, outsource, disclose, or otherwise commercially exploit the app.</li>
    <li>Modify, make derivative works of, disassemble, decrypt, reverse compile, or reverse engineer any part of the app.</li>
    <li>Remove, alter, or obscure any proprietary notice (including any notice of copyright or trademark) of Drift or its affiliates, partners, suppliers, or licensors.</li>
  </ul>

  <h1>5. Artificial Intelligence Disclaimer</h1>

  <h2>5.1 AI-Generated Content</h2>
  <p>Drift uses artificial intelligence (AI) and large language models (LLMs), including third-party providers such as OpenAI, to generate journaling prompts, responses, and session content. All AI-generated responses are automatically generated and may not always be accurate, complete, or appropriate for your specific situation.</p>
  <p>You acknowledge and agree that:</p>
  <ul>
    <li>AI-generated content is for informational and reflective purposes only.</li>
    <li>Drift does not guarantee the accuracy, reliability, or suitability of any AI-generated content.</li>
    <li>AI models can produce errors, inconsistencies, or unexpected outputs (sometimes called "hallucinations").</li>
    <li>Drift is not liable for any decisions you make based on AI-generated content.</li>
  </ul>

  <h2>5.2 Not a Medical or Mental Health Service</h2>
  <div class="warning">
    <p><strong>IMPORTANT:</strong> Drift is not a medical device, mental health service, therapy platform, crisis intervention service, or substitute for professional mental health care. Nothing in the app constitutes medical advice, psychological counseling, psychiatric treatment, or clinical diagnosis.</p>
  </div>
  <p>Drift is designed as a nighttime journaling and relaxation tool only. If you are experiencing a mental health crisis, suicidal thoughts, thoughts of harming yourself or others, or any other serious mental health concern, please immediately contact:</p>
  <ul>
    <li><strong>988 Suicide &amp; Crisis Lifeline:</strong> Call or text 988 (US)</li>
    <li><strong>Crisis Text Line:</strong> Text HOME to 741741</li>
    <li><strong>Emergency services:</strong> 911 (US) or your local emergency number</li>
    <li>A licensed mental health professional or your primary care physician</li>
  </ul>
  <p>By using Drift, you acknowledge that the app is not a replacement for professional help and that you will seek appropriate professional assistance when needed.</p>

  <h2>5.3 AI Safety Guardrails</h2>
  <p>Drift's AI is designed to detect certain keywords and phrases related to self-harm, suicide, or harm to others. When such content is detected, the app is programmed to pause normal conversation, display crisis resources, and ask for your confirmation before continuing. However, these guardrails are not infallible, and Drift does not guarantee that every instance of distress will be detected or appropriately handled.</p>
  <p>These safety features are not a substitute for human crisis intervention. If you are in danger, please contact emergency services immediately.</p>

  <h1>6. Data Collection, Privacy, and Mental Health Data</h1>

  <h2>6.1 Types of Data Collected</h2>
  <p>In order to provide personalized journaling experiences, Drift collects and processes the following categories of data:</p>
  <ul>
    <li>Account information: email address, authentication credentials</li>
    <li>Session data: session start and end times, duration, number of prompts completed</li>
    <li>Emotional state data: the emotional state you select at the beginning of each session (e.g., anxiety, stress, sadness, peace)</li>
    <li>AI-summarized journal insights: short summaries, sentiment scores, and thematic tags derived from your journal entries (e.g., "work stress," "relationship anxiety")</li>
    <li>To-do items and scheduled revisit reminders you create within the app</li>
    <li>Usage patterns: time-of-day usage, frequency of emotional states over time</li>
    <li>Device and technical data: device type, OS version, app crash reports, and error logs</li>
  </ul>

  <h2>6.2 Sensitive Mental Health Data</h2>
  <p>Data related to your emotional states, journaling themes, and mental health patterns is considered sensitive personal information. Drift is committed to protecting this data:</p>
  <ul>
    <li>Your journal-derived data is private by default and is not manually readable by Drift staff.</li>
    <li>Only aggregated, anonymized analytics are accessible internally.</li>
    <li>Raw journal text is not stored. Instead, Drift stores only AI-compressed summaries, tags, and sentiment scores.</li>
    <li>You may optionally enable end-to-end encryption for your journal content within app settings.</li>
  </ul>
  <p>Depending on your jurisdiction, your emotional and mental health data may be classified as sensitive personal information under applicable law, including GDPR (EU), CCPA (California), and similar regulations. Drift will handle this data in accordance with applicable law.</p>

  <h2>6.3 Voice Input and Microphone Access</h2>
  <p>Drift supports voice input through speech-to-text functionality. By enabling voice input, you grant Drift permission to access your device's microphone. Please note:</p>
  <ul>
    <li>Voice audio is processed in real time to convert speech to text.</li>
    <li>Processed audio may be transmitted to third-party speech-to-text services (including Apple's on-device speech recognition or equivalent providers).</li>
    <li>Raw audio recordings are not stored by Drift after transcription.</li>
    <li>You can revoke microphone access at any time through your device's settings.</li>
  </ul>

  <h2>6.4 Third-Party AI Data Processing</h2>
  <p>To generate journaling responses, Drift sends your text input (and in some cases, summarized prior session data) to third-party AI providers, including OpenAI. By using Drift, you acknowledge and consent to:</p>
  <ul>
    <li>Your journal input being transmitted to third-party LLM APIs for response generation.</li>
    <li>These transmissions occurring over encrypted connections (TLS 1.2 or higher).</li>
    <li>Third-party providers processing your data in accordance with their own privacy policies and terms of service.</li>
  </ul>
  <p>We recommend reviewing the privacy policies of our AI providers. Drift minimizes the data shared with third-party providers by sending only the current message and summarized memory — not your full journal history.</p>

  <h2>6.5 Data Retention and Deletion</h2>
  <p>Drift retains your data for as long as your account is active or as needed to provide services. You may request deletion of your data at any time by:</p>
  <ul>
    <li>Deleting your account within the app settings.</li>
    <li>Contacting us at <a href="mailto:driftjournal8@gmail.com">driftjournal8@gmail.com</a>.</li>
  </ul>
  <p>Upon account deletion, your session data, emotional state history, and AI-derived insights will be permanently deleted within 30 days, except where retention is required by law.</p>

  <h1>7. Notifications</h1>
  <p>Drift may send notifications to remind you of to-do items you have logged or thoughts you have scheduled to revisit. By enabling notifications, you consent to receiving these reminders.</p>
  <p>Notifications from Drift are designed to be gentle and non-urgent. You may opt out of notifications at any time through your device settings or within the app. Disabling notifications will not affect your ability to use the core journaling features of the app.</p>
  <p>Drift does not send marketing notifications without your explicit consent.</p>

  <h1>8. Subscription and Paid Features</h1>

  <h2>8.1 Free and Paid Plans</h2>
  <p>Drift offers both a free tier and a paid subscription plan. Certain features — including the extended continuation journaling flow — are available only to paid subscribers.</p>

  <h2>8.2 Billing and Auto-Renewal</h2>
  <p>Paid subscriptions are billed on a recurring basis (monthly or annually, as selected). Subscriptions automatically renew at the end of each billing period unless cancelled at least 24 hours before the renewal date.</p>
  <p>Payment is charged to your Apple ID account upon purchase confirmation. You can manage and cancel your subscription at any time through your Apple ID account settings in the App Store. Cancellation takes effect at the end of the current billing period — you will retain access to paid features until that date.</p>

  <h2>8.3 Refunds</h2>
  <p>All purchases made through the Apple App Store are subject to Apple's refund policy. Drift does not independently process refunds for in-app purchases. To request a refund, please contact Apple Support directly at <a href="https://reportaproblem.apple.com">reportaproblem.apple.com</a>.</p>
  <p>If you are not satisfied with Drift, please contact us at <a href="mailto:driftjournal8@gmail.com">driftjournal8@gmail.com</a> and we will do our best to address your concerns.</p>

  <h2>8.4 Price Changes</h2>
  <p>Drift reserves the right to modify subscription pricing at any time. You will be notified of any price changes before they take effect, and you will have the opportunity to cancel before being charged at the new rate.</p>

  <h1>9. User Content and Suggestions</h1>
  <p>Any feedback, comments, ideas, or suggestions (collectively, "Suggestions") you provide to Drift with respect to the app shall remain the sole and exclusive property of Drift. Drift shall be free to use, copy, modify, publish, or redistribute the Suggestions for any purpose and in any way without any credit or compensation to you.</p>
  <p>Your journal entries and personal content remain your own. Drift does not claim ownership over the personal thoughts and expressions you share within the app.</p>

  <h1>10. App Features and Design</h1>
  <p>Drift is designed to be a low-stimulation, distraction-free experience. The app avoids time pressure indicators during journaling sessions. These design choices are intentional to support relaxation and sleep readiness.</p>
  <p>Drift reserves the right to modify, suspend, or discontinue any features of the app at any time, with or without notice. Feature availability may vary depending on your subscription plan.</p>

  <h1>11. Cookies and Analytics</h1>
  <p>Drift's website uses cookies to identify areas of the site you have visited and to enhance functionality. Drift's mobile app may use analytics tools to collect anonymized usage data to improve the app experience. This data does not include the content of your journal entries.</p>
  <p>You may disable cookies in your browser settings; however, this may affect the functionality of Drift's website. Analytics data collection within the app can be managed through your device's privacy settings.</p>

  <h1>12. Third-Party Services</h1>
  <p>Drift integrates with third-party services including, but not limited to, AI/LLM providers, authentication providers (Supabase Auth), database providers, and push notification services. Drift is not responsible for the accuracy, availability, or privacy practices of these third-party services.</p>
  <p>Your use of third-party services integrated within Drift is subject to those services' own terms of service and privacy policies. Drift will disclose material third-party integrations that process your personal data.</p>

  <h1>13. Security</h1>
  <p>Drift takes the security of your data seriously and implements industry-standard protections, including:</p>
  <ul>
    <li>All data in transit is encrypted using HTTPS (TLS 1.2 or higher).</li>
    <li>Data at rest is encrypted by our infrastructure providers (Supabase).</li>
    <li>Your data is tied to your authenticated user ID. No cross-user data access is permitted.</li>
    <li>Row-level security is enforced at the database level.</li>
    <li>API keys and LLM credentials are stored server-side and never exposed to the client.</li>
  </ul>
  <p>Despite these measures, no system is completely secure. Drift cannot guarantee absolute security of your data and is not liable for unauthorized access beyond our reasonable control.</p>

  <h1>14. Intellectual Property</h1>
  <p>The Drift app and its entire contents, features, and functionality — including all information, software, text, displays, images, audio, and design — are owned by Drift or its licensors and are protected by applicable intellectual property laws. You may not copy, modify, reproduce, download, or distribute any part of the app without the express prior written permission of Drift.</p>

  <h1>15. Term and Termination</h1>
  <p>This Agreement shall remain in effect until terminated by you or Drift. Drift may, at its sole discretion and at any time, suspend or terminate this Agreement with or without prior notice. This Agreement will terminate immediately, without prior notice, if you fail to comply with any provision of this Agreement.</p>
  <p>You may terminate this Agreement by deleting the app and all copies from your device. Upon termination, you shall cease all use of the app. Termination does not limit any of Drift's rights or remedies at law or in equity.</p>

  <h1>16. Agreement to Arbitrate</h1>
  <p>Except for disputes relating to claims for injunctive or equitable relief regarding the enforcement or validity of intellectual property rights, any dispute between you and Drift arising out of or related to the Services must be resolved by binding arbitration in accordance with the commercial arbitration rules of the American Arbitration Association.</p>
  <p>You agree to first provide Drift with a written Notice of Dispute via email to <a href="mailto:driftjournal8@gmail.com">driftjournal8@gmail.com</a>. Drift and you will attempt to resolve the dispute through informal negotiation within 60 days. After 60 days, either party may commence arbitration.</p>
  <p>Any cause of action arising out of or related to the Services must be commenced within one (1) year after the cause of action accrues, or it is permanently barred.</p>

  <h1>17. No Warranties</h1>
  <p>The app is provided "AS IS" and "AS AVAILABLE" without warranty of any kind. To the maximum extent permitted by applicable law, Drift expressly disclaims all warranties, whether express, implied, statutory, or otherwise, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement.</p>
  <p>Drift does not warrant that the app will be uninterrupted, error-free, or that defects will be corrected.</p>

  <h1>18. Limitation of Liability</h1>
  <p>To the maximum extent permitted by applicable law, Drift's total liability to you for any claims arising under this Agreement is limited to the amount you paid for the app in the 12 months preceding the claim.</p>
  <p>In no event shall Drift be liable for any special, incidental, indirect, or consequential damages whatsoever, including loss of profits, data, or business interruption, even if advised of the possibility of such damages.</p>

  <h1>19. Changes to These Terms</h1>
  <p>Drift reserves the right to modify these Terms &amp; Conditions at any time. If a revision is material, Drift will provide at least 30 days' notice before new terms take effect, either through the app or via email. What constitutes a material change will be determined at Drift's sole discretion.</p>
  <p>By continuing to use the app after revisions become effective, you agree to be bound by the updated terms. If you do not agree to the new terms, you must stop using the app and may delete your account.</p>

  <h1>20. Contact Us</h1>
  <p>If you have any questions about these Terms &amp; Conditions, please contact us:</p>
  <ul>
    <li><strong>Email:</strong> <a href="mailto:driftjournal8@gmail.com">driftjournal8@gmail.com</a></li>
    <li><strong>For legal notices:</strong> <a href="mailto:driftjournal8@gmail.com">driftjournal8@gmail.com</a></li>
    <li><strong>For refund and billing issues:</strong> Contact Apple Support at <a href="https://reportaproblem.apple.com">reportaproblem.apple.com</a></li>
  </ul>

  <p class="footer">Drift Journal | Terms &amp; Conditions | April 2026</p>
</body>
</html>`;

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: "#4e1709", paddingTop: insets.top }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#7e3f2d",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ padding: 8, marginRight: 8 }}
        >
          <ChevronLeft size={24} color="#ffefdd" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#ffefdd", flex: 1 }}>
          Terms & Conditions
        </Text>
      </View>

      <WebView
        source={{ html: TERMS_HTML }}
        style={{ flex: 1, backgroundColor: "#fff" }}
        originWhitelist={["*"]}
        onShouldStartLoadWithRequest={(req) => {
          if (req.url.startsWith("mailto:")) {
            Linking.openURL(req.url);
            return false;
          }
          return true;
        }}
      />
    </View>
  );
}
