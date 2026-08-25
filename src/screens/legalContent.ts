/**
 * LiveGuard — Legal content (structured, FR + EN)
 *
 * Source: legal-fr.md / legal-en.md (provided by publisher).
 * Stored as structured TypeScript data rather than raw markdown
 * because the project has no markdown parser dependency.
 *
 * Three sections: terms, privacy, cookies — each in FR and EN.
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import type { Locale } from '../i18n/I18nContext';

// ─── Types ────────────────────────────────────────────────────────────

export type LegalSection = 'terms' | 'privacy' | 'cookies';

export interface LegalBlock {
  /** Heading text (e.g. "1.1 Objet"). Empty string = no heading. */
  heading?: string;
  /** Paragraph text(s) — each string is a separate paragraph */
  paragraphs?: string[];
  /** Bullet list items (if any) */
  list?: string[];
  /** Bold lead-in label before the list (e.g. "Données techniques :") */
  lead?: string;
}

export interface LegalMeta {
  publisher: string;
  contact: string;
  lastUpdated: string;
}

export interface LegalDocument {
  title: string;
  meta: LegalMeta;
  blocks: LegalBlock[];
}

// ─── FR content ───────────────────────────────────────────────────────

const frMeta: LegalMeta = {
  publisher: 'IA Solution — 30350 Alès, France',
  contact: 'contact@ia-solution.fr — +33 7 63 49 47 78',
  lastUpdated: '24 août 2026',
};

const frTerms: LegalDocument = {
  title: 'Conditions d\u2019utilisation',
  meta: frMeta,
  blocks: [
    { heading: '1.1 Objet', paragraphs: ['Les présentes conditions générales d\u2019utilisation (« CGU ») régissent l\u2019accès et l\u2019utilisation du site et de la démonstration LiveGuard (le « Service »), édité par IA Solution, dont le siège est situé 30350 Alès, France (« nous », « IA Solution »). En accédant au Service, vous acceptez sans réserve les présentes CGU.'] },
    { heading: '1.2 Description du Service', paragraphs: ['LiveGuard est une démonstration publique d\u2019une technologie de sécurité comportementale et cognitive, développée par IA Solution sous la marque HCS-U7. Le Service permet à tout visiteur d\u2019expérimenter des scénarios de simulation illustrant une détection d\u2019anomalie comportementale (changement de frappe, perte de focus, activité automatisée, etc.) et un mécanisme de re-vérification cognitive.', 'Le Service est fourni à titre de démonstration et d\u2019information. Il ne constitue ni un outil de production, ni une garantie de sécurité pour un usage réel, sauf intégration contractuelle distincte avec IA Solution.'] },
    { heading: '1.3 Accès au Service', paragraphs: ['L\u2019accès au Service est libre et gratuit pour tout utilisateur disposant d\u2019un accès à Internet. Les frais afférents à cet accès (matériel informatique, connexion Internet, etc.) sont à la charge exclusive de l\u2019utilisateur.', 'IA Solution se réserve le droit de modifier, suspendre ou interrompre tout ou partie du Service, à tout moment et sans préavis, notamment pour des raisons de maintenance.'] },
    { heading: '1.4 Propriété intellectuelle', paragraphs: ['L\u2019ensemble des éléments du Service (textes, logos, illustrations, code, architecture visuelle, marque LiveGuard, technologie HCS-U7) est la propriété exclusive d\u2019IA Solution ou de ses concédants, et est protégé par le droit de la propriété intellectuelle, notamment le droit d\u2019auteur et le droit des brevets.', 'Certains éléments de la technologie sous-jacente sont couverts par plusieurs brevets déposés en France. Toute reproduction, représentation, modification ou exploitation, totale ou partielle, sans autorisation préalable écrite d\u2019IA Solution, est interdite et susceptible de constituer une contrefaçon.'] },
    { heading: '1.5 Utilisation acceptable', paragraphs: ['L\u2019utilisateur s\u2019engage à ne pas :'], list: ['Utiliser le Service à des fins illégales ou non autorisées ;', 'Tenter de contourner, désactiver ou compromettre les mécanismes de sécurité du Service ;', 'Extraire, copier ou réutiliser le code, les modèles ou les données du Service sans autorisation ;', 'Perturber le fonctionnement normal du Service (surcharge, script automatisé abusif, etc.).'] },
    { heading: '1.6 Absence de garantie', paragraphs: ['Le Service est fourni « en l\u2019état ». IA Solution ne garantit pas que le Service sera exempt d\u2019erreurs, disponible en continu, ou adapté à un usage spécifique de l\u2019utilisateur. Les scénarios de démonstration illustrent des mécanismes de détection dont la fiabilité varie selon le scénario (voir la description de chaque scénario sur le Service).'] },
    { heading: '1.7 Limitation de responsabilité', paragraphs: ['Dans les limites autorisées par la loi française, IA Solution ne pourra être tenue responsable des dommages directs ou indirects résultant de l\u2019utilisation ou de l\u2019impossibilité d\u2019utiliser le Service.'] },
    { heading: '1.8 Droit applicable et juridiction', paragraphs: ['Les présentes CGU sont soumises au droit français. Tout litige relatif à leur interprétation ou leur exécution relève de la compétence exclusive des tribunaux français.'] },
    { heading: '1.9 Contact', paragraphs: ['Pour toute question relative aux présentes CGU : contact@ia-solution.fr'] },
  ],
};

const frPrivacy: LegalDocument = {
  title: 'Politique de confidentialité',
  meta: frMeta,
  blocks: [
    { heading: '2.1 Responsable du traitement', paragraphs: ['Le responsable du traitement des données à caractère personnel collectées via le Service est :', 'IA Solution — 30350 Alès, France — contact@ia-solution.fr'] },
    { heading: '2.2 Données collectées', paragraphs: ['Dans le cadre de l\u2019utilisation du Service, les données suivantes peuvent être collectées :'] },
    { lead: 'Données techniques de navigation :', list: ['adresse IP, type de navigateur, système d\u2019exploitation, pages visitées, horodatage des visites.'] },
    { lead: 'Signaux comportementaux (dans le cadre des scénarios de démonstration) :', list: ['dynamique de frappe clavier, mouvements de souris, interactions tactiles (mobile), résultats des exercices cognitifs (temps de réaction, scores), score de risque réseau calculé côté serveur.'] },
    { lead: 'Données de contact (si vous nous contactez) :', list: ['nom, adresse e-mail, contenu de votre message.'] },
    { paragraphs: ['Le Service ne collecte, à aucun moment, d\u2019image, de vidéo ou d\u2019enregistrement audio : aucune caméra ni microphone n\u2019est utilisé.'] },
    { heading: '2.3 Finalités du traitement', paragraphs: ['Ces données sont traitées pour les finalités suivantes :'], list: ['Faire fonctionner les scénarios de démonstration et illustrer les mécanismes de détection comportementale ;', 'Améliorer la fiabilité des modèles de détection (données agrégées et pseudonymisées) ;', 'Assurer la sécurité technique du Service (détection d\u2019abus, prévention des attaques) ;', 'Répondre aux demandes de contact.'] },
    { heading: '2.4 Base légale', paragraphs: ['Le traitement des données repose selon les cas sur :'], list: ['L\u2019intérêt légitime d\u2019IA Solution à démontrer et améliorer sa technologie (art. 6.1.f RGPD) ;', 'L\u2019exécution de mesures précontractuelles à la demande de la personne concernée, lorsque le Service est utilisé dans le cadre d\u2019une démonstration commerciale ;', 'Le consentement, notamment pour les cookies non essentiels (voir Politique de cookies).'] },
    { heading: '2.5 Durée de conservation', paragraphs: ['Les données de session de démonstration (signaux comportementaux, résultats de tests) sont conservées le temps nécessaire à l\u2019illustration du scénario, puis supprimées ou anonymisées dans un délai raisonnable n\u2019excédant pas 12 mois, sauf obligation légale contraire.', 'Les données de contact sont conservées 3 ans à compter du dernier échange, sauf relation contractuelle donnant lieu à une durée de conservation différente.'] },
    { heading: '2.6 Destinataires des données', paragraphs: ['Les données sont traitées par IA Solution et, le cas échéant, ses sous-traitants techniques (hébergement, infrastructure réseau — notamment Cloudflare pour la protection réseau et la distribution du contenu). Aucune donnée n\u2019est vendue à des tiers.', 'Les données peuvent être hébergées dans l\u2019Union européenne ou, pour certains sous-traitants techniques opérant une infrastructure mondiale (ex. Cloudflare), transférées hors UE dans le cadre de garanties appropriées (clauses contractuelles types de la Commission européenne).'] },
    { heading: '2.7 Vos droits', paragraphs: ['Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez des droits suivants sur vos données personnelles :'], list: ['Droit d\u2019accès, de rectification et d\u2019effacement ;', 'Droit à la limitation et à l\u2019opposition au traitement ;', 'Droit à la portabilité des données ;', 'Droit de définir des directives relatives au sort de vos données après votre décès.'] },
    { paragraphs: ['Pour exercer ces droits, contactez-nous à : contact@ia-solution.fr', 'Vous disposez également du droit d\u2019introduire une réclamation auprès de la Commission Nationale de l\u2019Informatique et des Libertés (CNIL — www.cnil.fr).'] },
    { heading: '2.8 Sécurité', paragraphs: ['IA Solution met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, perte ou altération, incluant notamment le chiffrement des communications et des contrôles d\u2019accès stricts.'] },
    { heading: '2.9 Profilage comportemental LiveGuard (parcours de test réel)', paragraphs: ['Lorsque vous utilisez le parcours de test cognitif de LiveGuard (et non les scénarios de démonstration), un identifiant technique anonyme (deviceProfileId) est généré aléatoirement et stocké dans le stockage local de votre navigateur (localStorage). Cet identifiant permet de suivre l\u2019évolution du comportement d\u2019un même appareil à travers plusieurs sessions, à des fins d\u2019amélioration du modèle de détection comportementale.', 'Les données comportementales collectées durant ce parcours (mouvements de souris, dynamique de frappe, interactions tactiles, défilement) sont persistées sur nos serveurs pour être utilisées comme données d\u2019entraînement pour le modèle de détection. Aucune information d\u2019identification directe (nom, adresse e-mail, etc.) n\u2019est collectée par ce mécanisme — seuls des motifs comportementaux agrégés et l\u2019identifiant technique anonyme sont conservés.', 'Vous pouvez à tout moment supprimer cet identifiant en vidant le stockage local de votre navigateur ou en utilisant le mode de navigation privée. La suppression de cet identifiant n\u2019affecte pas le fonctionnement du Service, mais empêche le suivi longitudinal de votre appareil.'] },
  ],
};

const frCookies: LegalDocument = {
  title: 'Politique de cookies',
  meta: frMeta,
  blocks: [
    { heading: '3.1 Qu\u2019est-ce qu\u2019un cookie ?', paragraphs: ['Un cookie est un petit fichier texte déposé sur votre appareil lors de la visite d\u2019un site web, permettant de reconnaître votre navigateur et de mémoriser certaines informations.'] },
    { heading: '3.2 Cookies utilisés par le Service' },
    { lead: 'Cookies strictement nécessaires (exemptés de consentement) :', list: ['Ces cookies sont indispensables au fonctionnement du Service (gestion de session, préférence de thème clair/sombre, préférence de langue, sécurité). Ils ne peuvent pas être désactivés sans altérer le fonctionnement du Service.'] },
    { lead: 'Cookies de mesure d\u2019audience (le cas échéant) :', list: ['Si des outils de mesure d\u2019audience sont utilisés, ils le sont dans une configuration exemptée de consentement lorsque cela est possible (données strictement statistiques et anonymisées), conformément aux recommandations de la CNIL, ou soumis à votre consentement préalable dans le cas contraire.'] },
    { lead: 'Cookies liés à la sécurité réseau (Cloudflare) :', list: ['Des cookies techniques peuvent être déposés par notre prestataire de protection réseau (Cloudflare) afin de distinguer un trafic légitime d\u2019un trafic potentiellement malveillant. Ces cookies sont strictement nécessaires à la sécurité du Service.'] },
    { heading: '3.3 Gestion de vos préférences', paragraphs: ['Vous pouvez à tout moment configurer votre navigateur pour refuser les cookies ou être averti avant leur dépôt. Le refus de certains cookies peut affecter le bon fonctionnement du Service.'] },
    { heading: '3.4 Durée de conservation', paragraphs: ['Les cookies déposés ont une durée de vie n\u2019excédant pas 13 mois, conformément aux recommandations de la CNIL.'] },
    { heading: '3.5 Contact', paragraphs: ['Pour toute question relative à notre utilisation des cookies : contact@ia-solution.fr'] },
  ],
};

// ─── EN content ───────────────────────────────────────────────────────

const enMeta: LegalMeta = {
  publisher: 'IA Solution — 30350 Alès, France',
  contact: 'contact@ia-solution.fr — +33 7 63 49 47 78',
  lastUpdated: '24 August 2026',
};

const enTerms: LegalDocument = {
  title: 'Terms of Use',
  meta: enMeta,
  blocks: [
    { heading: '1.1 Purpose', paragraphs: ['These Terms of Use (the "Terms") govern access to and use of the LiveGuard website and demonstration (the "Service"), published by IA Solution, whose registered office is located at 30350 Alès, France ("we", "IA Solution"). By accessing the Service, you agree to these Terms without reservation.'] },
    { heading: '1.2 Description of the Service', paragraphs: ['LiveGuard is a public demonstration of a behavioral and cognitive security technology, developed by IA Solution under the HCS-U7 brand. The Service allows any visitor to experience simulation scenarios illustrating behavioral anomaly detection (typing pattern changes, focus loss, automated activity, etc.) and a cognitive re-verification mechanism.', 'The Service is provided for demonstration and informational purposes. It does not constitute a production tool or a guarantee of security for real-world use, unless subject to a separate contractual integration with IA Solution.'] },
    { heading: '1.3 Access to the Service', paragraphs: ['Access to the Service is free of charge for any user with Internet access. Costs related to such access (hardware, Internet connection, etc.) are the sole responsibility of the user.', 'IA Solution reserves the right to modify, suspend, or discontinue all or part of the Service, at any time and without notice, in particular for maintenance purposes.'] },
    { heading: '1.4 Intellectual Property', paragraphs: ['All elements of the Service (text, logos, illustrations, code, visual architecture, the LiveGuard trademark, HCS-U7 technology) are the exclusive property of IA Solution or its licensors, and are protected by intellectual property law, including copyright and patent law.', 'Certain elements of the underlying technology are covered by several patents filed in France. Any reproduction, representation, modification, or exploitation, in whole or in part, without prior written authorization from IA Solution, is prohibited and may constitute infringement.'] },
    { heading: '1.5 Acceptable Use', paragraphs: ['The user agrees not to:'], list: ['Use the Service for illegal or unauthorized purposes;', 'Attempt to circumvent, disable, or compromise the Service\u2019s security mechanisms;', 'Extract, copy, or reuse the Service\u2019s code, models, or data without authorization;', 'Disrupt the normal operation of the Service (overload, abusive automated scripts, etc.).'] },
    { heading: '1.6 No Warranty', paragraphs: ['The Service is provided "as is". IA Solution does not warrant that the Service will be error-free, continuously available, or suited to any specific use by the user. Demonstration scenarios illustrate detection mechanisms whose reliability varies by scenario (see each scenario\u2019s description on the Service).'] },
    { heading: '1.7 Limitation of Liability', paragraphs: ['To the extent permitted by French law, IA Solution shall not be liable for direct or indirect damages resulting from the use or inability to use the Service.'] },
    { heading: '1.8 Governing Law and Jurisdiction', paragraphs: ['These Terms are governed by French law. Any dispute relating to their interpretation or performance shall fall under the exclusive jurisdiction of French courts.'] },
    { heading: '1.9 Contact', paragraphs: ['For any questions regarding these Terms: contact@ia-solution.fr'] },
  ],
};

const enPrivacy: LegalDocument = {
  title: 'Privacy Policy',
  meta: enMeta,
  blocks: [
    { heading: '2.1 Data Controller', paragraphs: ['The controller for personal data collected via the Service is:', 'IA Solution — 30350 Alès, France — contact@ia-solution.fr'] },
    { heading: '2.2 Data Collected', paragraphs: ['In the course of using the Service, the following data may be collected:'] },
    { lead: 'Technical browsing data:', list: ['IP address, browser type, operating system, pages visited, visit timestamps.'] },
    { lead: 'Behavioral signals (within demonstration scenarios):', list: ['keyboard typing dynamics, mouse movements, touch interactions (mobile), cognitive exercise results (reaction times, scores), server-side computed network risk score.'] },
    { lead: 'Contact data (if you contact us):', list: ['name, email address, message content.'] },
    { paragraphs: ['The Service never collects images, video, or audio recordings: no camera or microphone is used at any point.'] },
    { heading: '2.3 Purposes of Processing', paragraphs: ['This data is processed for the following purposes:'], list: ['Operating the demonstration scenarios and illustrating behavioral detection mechanisms;', 'Improving the reliability of detection models (aggregated and pseudonymized data);', 'Ensuring the technical security of the Service (abuse detection, attack prevention);', 'Responding to contact requests.'] },
    { heading: '2.4 Legal Basis', paragraphs: ['Data processing is based, depending on the case, on:'], list: ['IA Solution\u2019s legitimate interest in demonstrating and improving its technology (GDPR Art. 6.1.f);', 'Performance of pre-contractual measures at the request of the data subject, when the Service is used as part of a commercial demonstration;', 'Consent, in particular for non-essential cookies (see Cookie Policy).'] },
    { heading: '2.5 Retention Period', paragraphs: ['Demonstration session data (behavioral signals, test results) is retained for the time necessary to illustrate the scenario, then deleted or anonymized within a reasonable period not exceeding 12 months, unless otherwise required by law.', 'Contact data is retained for 3 years from the last exchange, unless a contractual relationship results in a different retention period.'] },
    { heading: '2.6 Data Recipients', paragraphs: ['Data is processed by IA Solution and, where applicable, its technical subprocessors (hosting, network infrastructure — including Cloudflare for network protection and content delivery). No data is sold to third parties.', 'Data may be hosted within the European Union or, for certain technical subprocessors operating global infrastructure (e.g. Cloudflare), transferred outside the EU under appropriate safeguards (European Commission Standard Contractual Clauses).'] },
    { heading: '2.7 Your Rights', paragraphs: ['In accordance with the General Data Protection Regulation (GDPR) and French data protection law, you have the following rights over your personal data:'], list: ['Right of access, rectification, and erasure;', 'Right to restriction and objection to processing;', 'Right to data portability;', 'Right to set guidelines for the fate of your data after your death.'] },
    { paragraphs: ['To exercise these rights, contact us at: contact@ia-solution.fr', 'You also have the right to lodge a complaint with the French data protection authority, the CNIL (www.cnil.fr).'] },
    { heading: '2.8 Security', paragraphs: ['IA Solution implements appropriate technical and organizational measures to protect your data against unauthorized access, loss, or alteration, including encrypted communications and strict access controls.'] },
    { heading: '2.9 LiveGuard Behavioral Profiling (Real Test Parcours)', paragraphs: ['When you use the LiveGuard cognitive test parcours (not the demo scenarios), an anonymous technical identifier (deviceProfileId) is randomly generated and stored in your browser\u2019s local storage. This identifier is used to track the behavioral evolution of a given device across multiple sessions, for the purpose of improving the behavioral detection model.', 'The behavioral data collected during this parcours (mouse movements, keystroke dynamics, touch interactions, scrolling) is persisted on our servers to be used as training data for the detection model. No directly identifying information (name, email address, etc.) is collected by this mechanism — only aggregated behavioral patterns and the anonymous technical identifier are retained.', 'You may delete this identifier at any time by clearing your browser\u2019s local storage or by using private browsing mode. Deleting this identifier does not affect the functioning of the Service, but prevents longitudinal tracking of your device.'] },
  ],
};

const enCookies: LegalDocument = {
  title: 'Cookie Policy',
  meta: enMeta,
  blocks: [
    { heading: '3.1 What is a Cookie?', paragraphs: ['A cookie is a small text file placed on your device when visiting a website, allowing your browser to be recognized and certain information to be remembered.'] },
    { heading: '3.2 Cookies Used by the Service' },
    { lead: 'Strictly necessary cookies (exempt from consent):', list: ['These cookies are essential to the operation of the Service (session management, light/dark theme preference, language preference, security). They cannot be disabled without impairing the Service\u2019s functionality.'] },
    { lead: 'Audience measurement cookies (if applicable):', list: ['If audience measurement tools are used, they are configured to be exempt from consent where possible (strictly statistical and anonymized data), in line with applicable regulatory guidance, or subject to your prior consent otherwise.'] },
    { lead: 'Network security cookies (Cloudflare):', list: ['Technical cookies may be set by our network protection provider (Cloudflare) to distinguish legitimate traffic from potentially malicious traffic. These cookies are strictly necessary for the security of the Service.'] },
    { heading: '3.3 Managing Your Preferences', paragraphs: ['You may configure your browser at any time to refuse cookies or to be notified before they are set. Refusing certain cookies may affect the proper functioning of the Service.'] },
    { heading: '3.4 Retention Period', paragraphs: ['Cookies are retained for a period not exceeding 13 months, in line with applicable regulatory guidance.'] },
    { heading: '3.5 Contact', paragraphs: ['For any questions regarding our use of cookies: contact@ia-solution.fr'] },
  ],
};

// ─── Export ───────────────────────────────────────────────────────────

const frDocs: Record<LegalSection, LegalDocument> = {
  terms: frTerms,
  privacy: frPrivacy,
  cookies: frCookies,
};

const enDocs: Record<LegalSection, LegalDocument> = {
  terms: enTerms,
  privacy: enPrivacy,
  cookies: enCookies,
};

export function getLegalDocument(section: LegalSection, locale: Locale): LegalDocument {
  return locale === 'en' ? enDocs[section] : frDocs[section];
}
