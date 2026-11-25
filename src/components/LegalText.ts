// Client-supplied wording (Signs Connect Co. Ltd): "SignConnect VRI - Terms of Use"
// and "Privacy Policy" PDFs, transcribed as written. Text between ** ** renders bold.
// Spots the client still needs to finish are marked TODO(client).

export type Block =
  | { p: string }
  | { note: string }
  | { ul: string[] }
  | { sub: string }
  | { table: { head: [string, string]; rows: [string, string][] } };

export interface LegalSection {
  id: string;
  title: string;
  blocks: Block[];
}

export interface LegalDocument {
  title: string;
  company?: string;
  sections: LegalSection[];
}

export const TERMS: LegalDocument = {
  title: 'SignConnect VRI – Terms of Use',
  sections: [
    {
      id: 'summary',
      title: 'Summary in plain language',
      blocks: [
        {
          note: `This summary is for convenience. The full terms below are what apply. We will also publish this summary as a sign language video and in text.`,
        },
        {
          ul: [
            `SignConnect connects Deaf and Hard of Hearing people with sign language interpreters by video, video message, or text and voice relay.`,
            `Interpreters relay what is said. They do not give advice, take sides, or share what they interpret.`,
            `Please do not record sessions, share them, or use the service to harass, deceive or harm anyone.`,
            `SignConnect is **not an emergency service** unless stated otherwise in Section 4.5.`,
            `We may pause or end access if these terms are broken, and you can challenge that decision.`,
            `We protect your data as described in our Privacy Policy.`,
          ],
        },
      ],
    },
    {
      id: 'about',
      title: '1. About these terms',
      blocks: [
        {
          p: `1.1 These Terms of Use ("**Terms**") are an agreement between you and **Signs Connect Co. Ltd** ("**Signs Connect**", "**we**", "**us**"), a private company limited by shares registered in Uganda, with PO Box, 221360. They govern your use of the SignConnect video relay and interpreting platform (the "**Platform**") through our apps, website and related services (together the "**Service**").`,
        },
        {
          p: `1.2 By creating an account or using the Service you agree to these Terms and to our **Privacy Policy**, which forms part of them. If you do not agree, please do not use the Service.`,
        },
        {
          p: `1.3 Our Mission is **Inclusive Communication, any time, anywhere.** We interpret these Terms in a way that supports that Mission.`,
        },
        {
          p: `1.4 These Terms apply to **Deaf and Hard of Hearing Users**, **Hearing Users**, and **Partner Organisations**. **Interpreters** are also bound by their separate Interpreter Agreement, which prevails if it conflicts with these Terms on interpreter conduct.`,
        },
      ],
    },
    {
      id: 'definitions',
      title: '2. Definitions',
      blocks: [
        {
          ul: [
            `**Interpreter:** a certified professional person who provides sign language interpreting through the Platform.`,
            `**Session:** a real-time video call, a video message exchange, or a text and voice relay conversation arranged through the Platform.`,
            `**Session Content:** anything signed, said, written or shown during a Session.`,
            `**Session Metadata:** non-content records of a Session (time, duration, channel, language, outcome, technical quality).`,
            `**Partner Organisation:** a business, clinic, school, court, government body, NGO or other organisation that books or pays for Sessions.`,
            `**User:** any Deaf or Hard of Hearing person, Hearing person, or Partner Organisation using the Service.`,
          ],
        },
      ],
    },
    {
      id: 'account',
      title: '3. Your account',
      blocks: [
        {
          p: `3.1 **Who can use the Service.** You must be at least 18 years old. A person under 18 may use the Service only with the consent and supervision of a parent or guardian, who is responsible for their use.`,
        },
        {
          p: `3.2 **Accurate information.** You must give accurate registration details and keep them up to date.`,
        },
        {
          p: `3.3 **Keeping your account safe.** Keep your password private. You are responsible for activity on your account. Tell us promptly if you think it has been misused.`,
        },
        {
          p: `3.4 **Registration.** Registration is required for scheduled Sessions. Where we offer a registration-free option for urgent or first-time use, it is subject to the same Terms. This follows the approach recommended in Europe, where registration should not become a barrier to access in an urgent situation.`,
        },
        {
          p: `3.5 **One person, one account,** unless a Partner Organisation has authorised named staff to use a shared organisational account.`,
        },
      ],
    },
    {
      id: 'service',
      title: '4. The Service',
      blocks: [
        {
          p: `4.1 **What we provide.** We connect Users with Interpreters through the channel that suits them: real-time video, video messaging, or text and voice relay. We design the Service for low-bandwidth and low-device environments, including rural areas.`,
        },
        {
          p: `4.2 **Languages.** We aim to offer Ugandan Sign Language, English, Luganda and other languages listed in the app. Language availability may vary.`,
        },
        {
          p: `4.3 **Service hours.** The Service is available 24 hours a day, Monday to Sunday. Hours are published in the app. If hours change, we will tell you in advance.`,
        },
        {
          p: `4.4 **Service quality.** We aim to connect you with an Interpreter within 1 minutes at least 97% of the time and to publish our quality standards and average waiting times quarterly. Quality also depends on your device, camera, lighting and network. We are not responsible for interruptions outside our control.`,
        },
        {
          p: `4.5 **Not an emergency service.** The Service is not designed to replace emergency calls. In an emergency, contact emergency services directly by any means available to you (for example 999 or 112). If Signs Connect later offers an emergency relay arrangement, its terms will be set out separately.`,
        },
        {
          p: `4.6 **Service changes.** We may improve, change or pause parts of the Service, and will give reasonable notice where we can.`,
        },
      ],
    },
    {
      id: 'sessions',
      title: '5. How Sessions work',
      blocks: [
        {
          p: `5.1 **The Interpreter's role.** Interpreters are professional communication links. They interpret faithfully and completely between the people in a Session. They do not give their own opinions, advice or decisions, do not take sides, and are not parties to the conversation.`,
        },
        {
          p: `5.2 **Impartiality and confidentiality.** Interpreters are bound by confidentiality and a professional code of conduct. They must not disclose what they interpret, except where the law compels disclosure.`,
        },
        {
          p: `5.3 **Accuracy.** Interpreters work to a high standard but interpreting can contain errors. If you think something was misunderstood, tell the Interpreter or us immediately. For legal, medical, financial or other important matters, you should confirm key information in writing or through another route.`,
        },
        {
          p: `5.4 **Interpreter's right to decline or end a Session.** An Interpreter may decline or end a Session where there is abuse, threats, a request to act unlawfully or unethically, a conflict of interest, a safety concern, or where the Interpreter is not competent for the content or language needed. We will help you reconnect with another Interpreter where possible.`,
        },
        {
          p: `5.5 **Equal treatment.** Interpreters will treat every User with respect regardless of gender, disability, ethnicity, religion, age, or any other characteristic.`,
        },
        {
          p: `5.6 **Hearing Users and other participants.** If you join a Session as a Hearing User, you agree to these Terms. A Hearing User should speak directly to the Deaf or Hard of Hearing person and not to the Interpreter, allow time for interpreting, and avoid speaking over others.`,
        },
      ],
    },
    {
      id: 'acceptable-use',
      title: '6. Acceptable use',
      blocks: [
        { p: `You agree **not** to:` },
        {
          ul: [
            `(a) **record, screenshot, copy or share** any Session or Session Content without the clear consent of everyone in the Session, unless the law requires it;`,
            `(b) use the Service to harass, threaten, abuse, discriminate against or exploit anyone, or for any unlawful, fraudulent or deceptive purpose;`,
            `(c) make hoax, nuisance or prank Sessions, or use the Service to impersonate another person;`,
            `(d) ask an Interpreter to disclose information about another User, to take sides, to act outside the interpreting role, or to meet or contact them outside the Platform;`,
            `(e) offer or give an Interpreter money, gifts or favours, or try to arrange paid work with them outside the Platform;`,
            `(f) share sexual, violent or otherwise harmful material through the Service;`,
            `(g) interfere with or try to breach the security of the Platform, reverse engineer it, or use bots or automated tools;`,
            `(h) let others use your account or use another person's account; or`,
            `(i) use the Service in a way that is contrary to the Computer Misuse Act or any other Ugandan law.`,
          ],
        },
      ],
    },
    {
      id: 'privacy-recording',
      title: '7. Privacy, recording and data',
      blocks: [
        {
          p: `7.1 We handle personal data as described in our **Privacy Policy** and in line with the Data Protection and Privacy Act, 2019.`,
        },
        {
          p: `7.2 **We do not record Session Content.** After a Session ends we keep Session Metadata only, unless the law requires otherwise. Video messages are held only until answered and then deleted within the period stated in the Privacy Policy.`,
        },
        {
          p: `7.3 **Quality monitoring** uses Session Metadata and User feedback. We will not listen to or watch live Sessions for quality purposes without clear prior notice and consent.`,
        },
        {
          p: `7.4 **Private space.** You are responsible for taking part in a place where you are comfortable that what you sign or say will not be seen or overheard by others, and for telling the Interpreter if someone else is present.`,
        },
      ],
    },
    {
      id: 'fees',
      title: '8. Fees and payment',
      blocks: [
        // TODO(client): 8.1 is cut off in the PDF ("...as indicated on all our") and 8.4 is a template line.
        { p: `8.1 Use of the Service is at coast for all users as indicated on all our` },
        {
          p: `8.2 Fees, billing periods and payment methods for Partner Organisations are set out in the booking or in a separate Partner Organisation Agreement. Prices are in Uganda Shillings.`,
        },
        {
          p: `8.3 We will tell you before any fee applies. If a fee applies, we will show it before you confirm a Session.`,
        },
        { p: `8.4 Cancellation and no-show rules: describe notice period and any charges.` },
      ],
    },
    {
      id: 'partners',
      title: '9. Partner Organisations',
      blocks: [
        {
          p: `9.1 A Partner Organisation must make sure it has the right to book Sessions for the people it books for, and must obtain any consent the law requires.`,
        },
        {
          p: `9.2 A Partner Organisation will not ask us or an Interpreter for Session Content, and will not use Session Metadata for any purpose other than managing its use of the Service.`,
        },
        {
          p: `9.3 A Partner Organisation will provide a suitable, private setting for Sessions it hosts, and will make sure its staff follow Section 6.`,
        },
      ],
    },
    {
      id: 'interpreters',
      title: '10. Interpreters',
      blocks: [
        {
          p: `Interpreters are independent professionals, or personnel engaged by Signs Connect under a separate Interpreter Agreement. Users must not treat an Interpreter as their own employee or agent. Nothing in these Terms creates an employment relationship between a User and an Interpreter.`,
        },
      ],
    },
    {
      id: 'feedback',
      title: '11. Feedback, complaints and safety',
      blocks: [
        {
          // TODO(client): contact channels in 11.1 and the "[3]" working days are still in brackets.
          p: `11.1 **Tell us.** You can give feedback or make a complaint about the Service or an Interpreter by in-app form / email / video message / phone number]. We accept complaints in sign language video, text or voice.`,
        },
        {
          p: `11.2 **How we handle complaints.** We will acknowledge your complaint within [3] working days and aim to respond fully within 14 days. Complaints about Interpreter conduct are handled under the Interpreter Agreement. We handle your complaint confidentially.`,
        },
        {
          p: `11.3 **Safety.** If a Session reveals a risk of serious harm to someone, we and the Interpreter may take reasonable steps allowed by law to protect them, including contacting the authorities.`,
        },
        { p: `11.4 If we cannot resolve your complaint, Section 16 applies.` },
      ],
    },
    {
      id: 'suspension',
      title: '12. Suspension and ending access',
      blocks: [
        {
          p: `12.1 We may warn, suspend, restrict or end your access if you break these Terms, put others at risk, or use the Service unlawfully.`,
        },
        {
          p: `12.2 Where we reasonably can, we will tell you what happened and give you a chance to respond first. In serious cases for example threats or abuse of an Interpreter we may suspend your access immediately.`,
        },
        {
          p: `12.3 You may ask us to review a suspension or ending of access by writing to signconnect026@gmail.com . We will respond within 14 days.`,
        },
        {
          p: `12.4 You may close your account at any time. We will then handle your data as set out in the Privacy Policy.`,
        },
        {
          p: `12.5 Sections that by their nature should continue after your access ends (including 6, 13, 14 and 16) will continue.`,
        },
      ],
    },
    {
      id: 'ip',
      title: '13. Intellectual property',
      blocks: [
        {
          p: `13.1 The Platform, the "Signs Connect" and "SignConnect" names and logos, software, designs and documentation belong to Signs Connect Co. LTD or our licensors. We give you a limited, non-exclusive, non-transferable right to use the Service and apps for its intended purpose.`,
        },
        {
          p: `13.2 You must not copy, modify, distribute, sell or lease any part of the Platform, or remove any notice on it.`,
        },
        {
          p: `13.3 Session Content belongs to the participants. We claim no ownership of it and do not use it for any purpose beyond providing the Session.`,
        },
      ],
    },
    {
      id: 'liability',
      title: '14. Disclaimers and limits of liability',
      blocks: [
        {
          p: `14.1 We provide the Service with reasonable care and skill. We do not promise it will always be uninterrupted or error-free.`,
        },
        {
          p: `14.2 To the extent the law allows, we are not liable for loss caused by events beyond our reasonable control, your device or network, misunderstanding that you did not promptly report, or your breach of these Terms.`,
        },
        {
          p: `14.3 Nothing in these Terms limits liability that cannot lawfully be limited, including for fraud, death or personal injury caused by negligence, or any right you have under the Data Protection and Privacy Act, 2019.`,
        },
      ],
    },
    {
      id: 'changes',
      title: '15. Changes to these Terms',
      blocks: [
        {
          p: `15.1 We may update these Terms from time to time. We will publish the new version in the app and on our website and give you at least [30] days' notice of material changes by email, SMS or in-app message, with a sign language video summary where practical.`,
        },
        {
          p: `15.2 If you keep using the Service after the changes take effect, you accept them. If you do not agree, you may close your account.`,
        },
      ],
    },
    {
      id: 'law',
      title: '16. Governing law and disputes',
      blocks: [
        { p: `16.1 These Terms are governed by the laws of Uganda.` },
        {
          p: `16.2 If there is a dispute, please contact us first so we can try to resolve it in good faith within [30] days. If it is not resolved, either side may refer it to mediation before a mediator agreed between us or appointed by the Centre for Arbitration and Dispute Resolution (CADER). Nothing stops you from complaining to the Personal Data Protection Office about a data protection matter, or from going to a court of competent jurisdiction in Uganda.`,
        },
      ],
    },
    {
      id: 'contact',
      title: '17. Contact',
      blocks: [
        {
          p: `Signs Connect Co. Ltd, PO BOX, 221360. ,Uganda · signconnect026@gmail.com +256773728191`,
        },
      ],
    },
  ],
};

export const PRIVACY: LegalDocument = {
  title: 'Privacy Policy',
  company: 'Signs Connect Co. Ltd',
  sections: [
    {
      id: 'who',
      title: '1. Who we are and what this policy covers',
      blocks: [
        {
          p: `Signs Connect Co. Ltd ("**Signs Connect**", "**we**", "**us**") is a private company limited by shares, registered in Uganda, with P.O Box, 221360. We operate the SignConnect video relay interpreting platform (the "**VRI Platform**"), which connects Deaf and Hard of Hearing persons with sign language interpreters through real-time video, video messaging, and text and voice relay.`,
        },
        {
          p: `Our Mission is **Inclusive Communication, any time, anywhere.** We treat the privacy, dignity and safety of Deaf and Hard of Hearing users and interpreters as a primary consideration in every decision we make about data.`,
        },
        {
          p: `This policy explains what personal data we collect, why, how we protect it, and the rights you have. It applies to everyone who uses or is involved with the VRI Platform ("**Users**"), including:`,
        },
        {
          ul: [
            `**Deaf and Hard of Hearing Users** who request interpreting;`,
            `**Hearing Users** who communicate with a Deaf or Hard of Hearing person through the platform;`,
            `**Interpreters** who provide interpreting through the platform;`,
            `**Partner Organisations** (for example clinics, schools, courts, businesses and NGOs) that book or pay for interpreting for their clients or staff; and`,
            `**Visitors** to our website and apps.`,
          ],
        },
        {
          p: `By using the VRI Platform you agree to the rules in this policy, including the User responsibilities in Section 9.`,
        },
      ],
    },
    {
      id: 'role',
      title: '2. Our role under the law',
      blocks: [
        {
          // TODO(client): the PDPO registration number is blank in the PDF.
          p: `We are a **data controller and data collector** under the Data Protection and Privacy Act, 2019 (the "**Act**") for the personal data described in this policy. We are registered, with the Personal Data Protection Office (PDPO) under section 29 of the Act and Regulation 15 of the Data Protection and Privacy Regulations, 2021, registration number.`,
        },
        {
          p: `When a Partner Organisation books an interpreter for its own client, the Partner Organisation decides why that conversation takes place and is responsible for what it does with its own records. We remain responsible for what happens inside the VRI Platform.`,
        },
      ],
    },
    {
      id: 'collect',
      title: '3. What personal data we collect',
      blocks: [
        { sub: `3.1 Data you give us` },
        {
          ul: [
            `**Account data:** name, phone number, email, username, password (stored in hashed form only), preferred language (for example Ugandan Sign Language, English, Luganda), preferred communication channel, and district or region.`,
            `**Interpreter data:** the above, plus qualifications, certifications, availability, rate and payment details, and identity verification information (such as National ID number)`,
            `**Partner Organisation data:** organization/Institution name, registration details, contact person and billing details.`,
            `**Support and feedback:** messages you send us, complaints, ratings and reviews.`,
          ],
        },
        { sub: `3.2 Data created when you use the platform (non-content metadata)` },
        {
          p: `In line with Article 12.1 of our Articles of Association, we keep records of sessions as **non-content metadata only**. For each session this may include: date and time, duration, channel used (video, video message, text/voice relay), participants' account identifiers, language pair, session outcome (completed, missed, cancelled), and technical quality indicators (such as connection drops).`,
        },
        { sub: `3.3 Technical data` },
        {
          p: `Device type, operating system, app version, IP address, approximate network quality, crash logs and basic usage analytics. We design for low-bandwidth and low-device environments and collect only what we need to keep the service working.`,
        },
        { sub: `3.4 Special personal data` },
        {
          p: `Because our services are used by Deaf and Hard of Hearing persons, using the platform may itself reveal information about a person's **hearing status or disability**, which is health-related and treated by the Act as special personal data. We also cannot control what is discussed in a session, which may include health, legal, financial or other sensitive matters. We therefore handle all session content as highly sensitive (see Section 5), and we only process special personal data with your **explicit consent** or where the Act otherwise allows.`,
        },
        { sub: `3.5 Children` },
        {
          p: `We do not knowingly create accounts for children under 18 without the consent of a parent or guardian. Where a child is a participant in a session (for example at school or a clinic), the Partner Organisation or the child's parent or guardian is responsible for obtaining consent. If you believe a child has joined without consent, contact us and we will act promptly.`,
        },
      ],
    },
    {
      id: 'use',
      title: '4. Why we use your data and our lawful basis',
      blocks: [
        {
          table: {
            head: ['Purpose', 'Lawful basis'],
            rows: [
              [`Create and manage your account; verify interpreters`, `Contract; consent`],
              [`Connect Users with interpreters and run sessions`, `Contract; consent`],
              [
                `Schedule, bill and pay Interpreters and Partner Organisations`,
                `Contract; legal obligation (tax and accounting)`,
              ],
              [
                `Keep the platform secure; prevent fraud and abuse; investigate safety incidents`,
                `Legitimate interest; legal obligation`,
              ],
              [
                `Improve service quality, accessibility and affordability for Deaf and Hard of Hearing Users (using aggregated or anonymised data where possible)`,
                `Consent; legitimate interest`,
              ],
              [`Comply with the law, court orders and regulator requests`, `Legal obligation`],
              [`Send service notices and, with your permission, updates`, `Contract; consent`],
            ],
          },
        },
        {
          p: `We do **not** sell personal data, and we do not use session content for advertising or to train artificial intelligence or machine-learning systems; if you plan any such use, it must be separately disclosed and consented to.`,
        },
      ],
    },
    {
      id: 'session-content',
      title: '5. Session content: our strictest commitment',
      blocks: [
        { p: `What is said, signed or typed in a session belongs to the participants, not to us.` },
        {
          ul: [
            `**No recording by default.** We do not record or store the audio, video or text of live sessions. Live video and relay sessions are transmitted for the duration of the session only.`,
            `**Video messaging.** Where a User sends a video message for an interpreter to respond to, the message must be held until it is delivered and answered. We keep it only for that purpose and delete it within 2 years`,
            `**Metadata only afterwards.** After a session ends we keep metadata only (Section 3.2), unless the law requires otherwise.`,
            `**Interpreters are bound by confidentiality.** Every Interpreter, Director, employee and developer signs a confidentiality undertaking before accessing user data or sessions (Article 12.2), and must not disclose, copy, record or discuss session content, except where the law compels disclosure.`,
            `**Compelled disclosure.** If a court or authority lawfully requires us to disclose data, we will disclose only what is legally required and, where the law allows, tell the affected User first.`,
          ],
        },
      ],
    },
    {
      id: 'share',
      title: '6. Who we share data with',
      blocks: [
        { p: `We share personal data only where necessary and only as follows:` },
        {
          ul: [
            `**Interpreters,** who see only what they need to carry out the session (for example your name or alias, language and channel).`,
            `**Partner Organisations,** which receive session metadata and billing information for sessions they booked or paid for, but never session content.`,
            `**Service providers** who help us run the platform (hosting, video infrastructure, SMS and email, mobile money and payment processing, analytics). They act on our instructions under written agreements requiring confidentiality and security.`,
            `**Authorities,** where required by law, including the PDPO, courts, the Uganda Revenue Authority and URSB.`,
            `**Professional advisers and, in a sale of the business,** a buyer, under confidentiality and subject to the approvals required by our Articles.`,
          ],
        },
        { p: `We never allow service providers to use your data for their own purposes.` },
      ],
    },
    {
      id: 'transfers',
      title: '7. International transfers',
      blocks: [
        {
          // TODO(client): "[list countries/providers]" still to be filled in.
          p: `Some of our service providers may store or process data outside Uganda [list countries/providers]. Under section 19 of the Act we transfer personal data outside Uganda only where the receiving country or provider has adequate data protection measures, or where you have consented, and we use contracts that require equivalent protection.`,
        },
      ],
    },
    {
      id: 'security',
      title: '8. How we protect your data and how long we keep it',
      blocks: [
        { sub: `8.1 Security` },
        {
          p: `We use measures appropriate to the sensitivity of the data, including encryption of sessions and stored data in transit and at rest, access controls limited to those who need access, confidentiality undertakings, logging of staff access, regular security reviews, and secure development practices.`,
        },
        { sub: `8.2 Data breaches` },
        {
          p: `If there is a breach of data security that affects your personal data, we will notify the PDPO and the affected persons as required by section 23 of the Act, and tell you what happened, what data is affected and what you can do.`,
        },
        { sub: `8.3 Retention` },
        {
          table: {
            head: ['Data', 'Retention'],
            rows: [
              [`Account data`, `While your account is active, then 6 months after closure`],
              [`Session metadata`, `2 years, or as required for billing and audit`],
              [`Video messages awaiting reply`, `6 months`],
              [`Billing and tax records`, `5 years as the law requires`],
              [
                `Interpreter verification records`,
                `Duration of engagement as guided by Interpreters Body`,
              ],
              [`Support records`, `5 years`],
            ],
          },
        },
        {
          p: `When data is no longer needed we delete it or anonymise it so it can no longer identify you.`,
        },
      ],
    },
    {
      id: 'responsibilities',
      title: '9. User responsibilities',
      blocks: [
        {
          p: `Because the VRI Platform depends on trust between Users and Interpreters, every User agrees to the following.`,
        },
        { sub: `All Users must:` },
        {
          ul: [
            `provide accurate account information and keep their login details private;`,
            `respect the privacy, dignity and safety of other Users and Interpreters;`,
            `**not record, screenshot, copy or share** any session, or anything said or signed in it, without the clear consent of everyone in the session, unless the law requires it;`,
            `not use the platform for harassment, discrimination, fraud, or any unlawful purpose; and`,
            `report privacy or safety concerns to us promptly.`,
          ],
        },
        { sub: `Interpreters must also:` },
        {
          ul: [
            `keep all session content strictly confidential, during and after their engagement;`,
            `not contact Users outside the platform about matters learned in a session, or use User data for any other purpose;`,
            `decline or leave a session where they cannot remain impartial or confidential, or where they are asked to do something unlawful; and`,
            `report any suspected breach immediately.`,
          ],
        },
        { sub: `Partner Organisations must also:` },
        {
          ul: [
            `obtain any consents they need from their clients before booking sessions on the clients' behalf;`,
            `not ask us or Interpreters for session content; and`,
            `protect session metadata they receive in line with the Act.`,
          ],
        },
        {
          p: `We may warn, suspend or remove a User or Interpreter who breaches this policy, and we may report unlawful conduct to the authorities.`,
        },
      ],
    },
    {
      id: 'rights',
      title: '10. Your rights',
      blocks: [
        { p: `Under the Act you have the right to:` },
        {
          ul: [
            `**Be informed** about how we use your data (this policy);`,
            `**Access** the personal data we hold about you;`,
            `**Correct** inaccurate or incomplete data;`,
            `**Request deletion** of data we no longer need or have no lawful basis to keep;`,
            `**Object** to or ask us to **restrict** certain processing, including direct marketing;`,
            `**Withdraw consent** at any time, without affecting what was done before you withdrew; and`,
            `**Complain** to us or to the PDPO (see Section 12).`,
          ],
        },
        {
          p: `To use any right, contact our privacy contact in Section 2. We will verify your identity and respond within 30 days. We offer this in the channel that suits you, including sign language video, text or voice relay, and will not charge a fee for ordinary requests.`,
        },
      ],
    },
    {
      id: 'cookies',
      title: '11. Cookies, analytics and marketing',
      blocks: [
        {
          p: `Our website and apps use only essential cookies / essential and analytics cookies. You can control cookies through your browser or device settings. We send marketing messages only with your consent, and you can opt out at any time.`,
        },
      ],
    },
    {
      id: 'contact',
      title: '12. Complaints, changes and contact',
      blocks: [
        {
          p: `**Complaints.** Please first contact our privacy contact so we can try to resolve your concern. If you are not satisfied, you may complain to the Personal Data Protection Office, National Information Technology Authority – Uganda (NITA-U).`,
        },
        {
          p: `**Changes.** We will update this policy when our practices or the law change. For material changes we will give notice through the platform and by email or SMS at least 30 days before they take effect, and where the law requires consent, we will ask for it again.`,
        },
        {
          p: `**Contact.** Signs Connect Co. Ltd, PO BOX, 221360. ,Uganda · signconnect026@gmail.com +256773728191`,
        },
      ],
    },
  ],
};
