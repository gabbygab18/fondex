import { Head, usePage } from '@inertiajs/react';
import { PageHero } from '@/components/site';
import { siteLayout } from '@/Layouts/SiteLayout';
import { useLocale, useT } from '@/lib/i18n';
import type { SharedProps } from '@/types';

type Doc = { title: string; intro: string; sections: [string, string[]][] };

// Legal copy is written per language instead of via t(): it is long-form and must read naturally in each.
// Review with a local lawyer before going live.
const content = (name: string, email: string): Record<'es' | 'en', Record<'privacy' | 'terms', Doc>> => ({
    en: {
        privacy: {
            title: 'Privacy Policy',
            intro: `This policy explains how ${name} ("we") collects, uses and protects your personal data when you use our website and apply for a loan. It is issued under Argentina's Personal Data Protection Law No. 25,326 and Colombia's Law 1581 of 2012 (Habeas Data) and Decree 1377 of 2013.`,
            sections: [
                ['1. Data we collect', [
                    'Identification data: full name, national ID number (DNI or Cédula), date of birth.',
                    'Contact data: email address, phone number, city and address.',
                    'Financial data: income, employment status, requested amount and term, and the documents you upload (ID and proof of income).',
                    'Technical data: IP address, browser type and session cookies needed for the site to work.',
                ]],
                ['2. Why we use it', [
                    'To evaluate your loan application and verify your identity.',
                    'To manage your loan, repayment schedule and payments.',
                    'To send you emails about your application status and your account.',
                    'To comply with legal obligations, including anti-money-laundering rules.',
                ]],
                ['3. Legal basis and consent', [
                    'We process your data with your prior, express and informed consent, which you give when you submit an application, and when processing is needed to perform the loan contract or comply with the law.',
                ]],
                ['4. Who we share it with', [
                    'We never sell your data. We only share it with credit bureaus and identity verification providers when needed to assess your application, with payment processors to receive your payments, and with authorities when the law requires it.',
                ]],
                ['5. How we protect it', [
                    'Documents are stored on private, encrypted storage and are only accessible to authorized credit staff. Access to our systems is logged and protected by passwords and roles.',
                ]],
                ['6. Your rights', [
                    'Argentina: you may access, rectify, update and delete your data free of charge at intervals of no less than six months, unless you have a legitimate interest (art. 14, Law 25,326). The Agencia de Acceso a la Información Pública is the supervisory authority and handles complaints about breaches of personal data rules.',
                    'Colombia: you may know, update, rectify and request deletion of your data, request proof of your authorization, and file complaints with the Superintendencia de Industria y Comercio (SIC).',
                    `To exercise any of these rights, write to ${email}. We reply within the legal deadlines (10 calendar days for access in Argentina; 10 business days for queries and 15 business days for claims in Colombia).`,
                ]],
                ['7. Retention', [
                    'We keep your data while your account or loan is active, and afterwards for the time required by financial and tax regulations.',
                ]],
                ['8. Changes', [
                    'We may update this policy. We will publish the new version on this page and, when changes are significant, notify you by email.',
                ]],
            ],
        },
        terms: {
            title: 'Terms and Conditions',
            intro: `These terms govern the use of the ${name} website and the loan application process. By creating an account or applying for a loan you accept them.`,
            sections: [
                ['1. Eligibility', [
                    'You must be at least 18 years old, reside in Argentina or Colombia, hold a valid national ID and have a bank account in your name.',
                ]],
                ['2. Application and approval', [
                    'Submitting an application does not guarantee approval. We evaluate each application individually and may request additional information. We will notify you of the decision by email.',
                    'You declare that all information and documents you provide are true and complete. False information may lead to rejection or early termination of the loan.',
                ]],
                ['3. Rates and costs', [
                    'The calculator shows estimates. Interest is a flat rate charged once on the amount borrowed. The final rate, installment amount, total cost and payment schedule are confirmed when your loan is approved and are always visible in your account. We charge no hidden fees.',
                    'Your rate, the total cost of the loan and every installment are shown in your loan contract before you accept it.',
                ]],
                ['4. Repayment', [
                    'You agree to pay each installment on its due date using the payment methods we make available. You may prepay part or all of your loan at any time without penalty.',
                    'Late payments may generate default interest within the legal limits and may be reported to credit bureaus, after prior notice where the law requires it.',
                ]],
                ['5. Your account', [
                    'You are responsible for keeping your password confidential and for all activity in your account. Tell us immediately if you suspect unauthorized use.',
                ]],
                ['6. Consumer rights', [
                    'Argentina: you are protected by the Consumer Protection Law No. 24,240, including the right to revoke acceptance within 10 days of receiving the funds or signing the contract, whichever is later.',
                    'Colombia: you are protected by Law 1480 of 2011 (Consumer Statute) and Law 1328 of 2009 on financial consumers.',
                ]],
                ['7. Liability', [
                    'We work to keep the website available and accurate, but we are not liable for temporary interruptions or for decisions you make based solely on calculator estimates.',
                ]],
                ['8. Governing law', [
                    'These terms are governed by the laws of the country where you reside (Argentina or Colombia), and its competent courts have jurisdiction.',
                    `Questions about these terms: ${email}.`,
                ]],
            ],
        },
    },
    es: {
        privacy: {
            title: 'Política de Privacidad',
            intro: `Esta política explica cómo ${name} ("nosotros") recopila, usa y protege tus datos personales cuando usas nuestro sitio web y solicitas un préstamo. Se emite conforme a la Ley de Protección de Datos Personales N.° 25.326 de Argentina y la Ley 1581 de 2012 (Habeas Data) y el Decreto 1377 de 2013 de Colombia.`,
            sections: [
                ['1. Datos que recopilamos', [
                    'Datos de identificación: nombre completo, número de documento (DNI o Cédula) y fecha de nacimiento.',
                    'Datos de contacto: correo electrónico, teléfono, ciudad y dirección.',
                    'Datos financieros: ingresos, situación laboral, monto y plazo solicitados, y los documentos que subes (identificación y comprobante de ingresos).',
                    'Datos técnicos: dirección IP, tipo de navegador y cookies de sesión necesarias para que el sitio funcione.',
                ]],
                ['2. Para qué los usamos', [
                    'Para evaluar tu solicitud de préstamo y verificar tu identidad.',
                    'Para administrar tu préstamo, tu plan de pagos y tus pagos.',
                    'Para enviarte correos sobre el estado de tu solicitud y tu cuenta.',
                    'Para cumplir obligaciones legales, incluidas las normas de prevención de lavado de activos.',
                ]],
                ['3. Base legal y consentimiento', [
                    'Tratamos tus datos con tu consentimiento previo, expreso e informado, que otorgas al enviar una solicitud, y cuando el tratamiento es necesario para ejecutar el contrato de préstamo o cumplir la ley.',
                ]],
                ['4. Con quién los compartimos', [
                    'Nunca vendemos tus datos. Solo los compartimos con centrales de riesgo y proveedores de verificación de identidad cuando es necesario para evaluar tu solicitud, con procesadores de pago para recibir tus pagos y con autoridades cuando la ley lo exige.',
                ]],
                ['5. Cómo los protegemos', [
                    'Los documentos se guardan en un almacenamiento privado y cifrado, y solo el personal de crédito autorizado puede verlos. El acceso a nuestros sistemas queda registrado y está protegido por contraseñas y roles.',
                ]],
                ['6. Tus derechos', [
                    'Argentina: puedes acceder, rectificar, actualizar y suprimir tus datos en forma gratuita a intervalos no inferiores a seis meses, salvo que acredites un interés legítimo (art. 14, Ley 25.326). La Agencia de Acceso a la Información Pública es el órgano de control y atiende las denuncias por incumplimiento de las normas de protección de datos personales.',
                    'Colombia: puedes conocer, actualizar, rectificar y solicitar la supresión de tus datos, pedir prueba de tu autorización y presentar quejas ante la Superintendencia de Industria y Comercio (SIC).',
                    `Para ejercer cualquiera de estos derechos escribe a ${email}. Respondemos dentro de los plazos legales (10 días corridos para el acceso en Argentina; 10 días hábiles para consultas y 15 días hábiles para reclamos en Colombia).`,
                ]],
                ['7. Conservación', [
                    'Conservamos tus datos mientras tu cuenta o préstamo estén activos y, después, durante el tiempo que exigen las normas financieras y tributarias.',
                ]],
                ['8. Cambios', [
                    'Podemos actualizar esta política. Publicaremos la nueva versión en esta página y, si los cambios son importantes, te avisaremos por correo.',
                ]],
            ],
        },
        terms: {
            title: 'Términos y Condiciones',
            intro: `Estos términos regulan el uso del sitio web de ${name} y el proceso de solicitud de préstamos. Al crear una cuenta o solicitar un préstamo los aceptas.`,
            sections: [
                ['1. Requisitos', [
                    'Debes tener al menos 18 años, residir en Argentina o Colombia, contar con un documento de identidad vigente y una cuenta bancaria a tu nombre.',
                ]],
                ['2. Solicitud y aprobación', [
                    'Enviar una solicitud no garantiza su aprobación. Evaluamos cada solicitud de forma individual y podemos pedirte información adicional. Te informaremos la decisión por correo.',
                    'Declaras que toda la información y los documentos que entregas son verdaderos y completos. La información falsa puede causar el rechazo o la terminación anticipada del préstamo.',
                ]],
                ['3. Tasas y costos', [
                    'La calculadora muestra estimaciones. El interés es una tasa fija que se cobra una sola vez sobre el monto prestado. La tasa final, el valor de cada cuota, el costo total y el plan de pagos se confirman al aprobarse tu préstamo y siempre están visibles en tu cuenta. No cobramos cargos ocultos.',
                    'Tu tasa, el costo total del préstamo y cada cuota se muestran en tu contrato antes de que lo aceptes.',
                ]],
                ['4. Pago', [
                    'Te comprometes a pagar cada cuota en su fecha de vencimiento con los medios de pago que ponemos a tu disposición. Puedes pagar por adelantado parte o la totalidad del préstamo en cualquier momento sin penalidad.',
                    'Los pagos atrasados pueden generar intereses moratorios dentro de los límites legales y ser reportados a centrales de riesgo, previo aviso cuando la ley lo exija.',
                ]],
                ['5. Tu cuenta', [
                    'Eres responsable de mantener tu contraseña en secreto y de toda la actividad de tu cuenta. Avísanos de inmediato si sospechas un uso no autorizado.',
                ]],
                ['6. Derechos del consumidor', [
                    'Argentina: te protege la Ley de Defensa del Consumidor N.° 24.240, incluido el derecho a revocar la aceptación dentro de los 10 días de recibir los fondos o de firmar el contrato, lo que ocurra último.',
                    'Colombia: te protegen la Ley 1480 de 2011 (Estatuto del Consumidor) y la Ley 1328 de 2009 sobre consumidores financieros.',
                ]],
                ['7. Responsabilidad', [
                    'Trabajamos para mantener el sitio disponible y preciso, pero no somos responsables por interrupciones temporales ni por decisiones tomadas solo con base en las estimaciones de la calculadora.',
                ]],
                ['8. Ley aplicable', [
                    'Estos términos se rigen por las leyes del país donde resides (Argentina o Colombia), y son competentes sus tribunales.',
                    `Preguntas sobre estos términos: ${email}.`,
                ]],
            ],
        },
    },
});

export default function Legal({ page }: { page: 'privacy' | 'terms' }) {
    const { app } = usePage<SharedProps>().props;
    const locale = useLocale();
    const t = useT();
    const doc = content(app.name, app.email)[locale === 'en' ? 'en' : 'es'][page];

    return (
        <>
            <Head title={doc.title} />
            <PageHero eyebrow={t('Legal')} title={doc.title}>
                {t('Last updated: :date', { date: locale === 'en' ? 'November 2026' : 'noviembre de 2026' })}
            </PageHero>
            <section className="py-16 md:py-24">
                <div className="container-page">
                <article className="max-w-3xl">
                    <p className="text-lg leading-relaxed text-navy">{doc.intro}</p>
                    {doc.sections.map(([heading, paras]) => (
                        <section key={heading} className="mt-10">
                            <h2 className="text-xl font-bold text-navy">{heading}</h2>
                            {paras.map((p) => (
                                <p key={p} className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                                    {p}
                                </p>
                            ))}
                        </section>
                    ))}
                </article>
                </div>
            </section>
        </>
    );
}

Legal.layout = siteLayout;
