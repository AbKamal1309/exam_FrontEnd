import { Injectable, signal } from '@angular/core';

export type Lang = 'fr' | 'ar';

export const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  fr: {
    // Navbar
    'nav.dashboard':     'Dashboard',
    'nav.exams':         'Examens',
    'nav.users':         'Utilisateurs',
    'nav.login':         'Connexion',
    'nav.logout':        'Déconnexion',

    // Landing
    'landing.badge':        '🎓 Plateforme d\'examens en ligne',
    'landing.title1':       'Créez, gérez et passez',
    'landing.title2':       'vos examens',
    'landing.title3':       'facilement',
    'landing.subtitle':     'ExamPlatform vous permet de créer des examens avec questions et réponses, de les partager avec vos étudiants et de suivre leurs performances en temps réel.',
    'landing.start':        'Commencer gratuitement →',
    'landing.signin':       'Se connecter',
    'landing.stat1':        'En ligne',
    'landing.stat2':        'Examens',
    'landing.stat3':        'Interactif',
    'landing.feat.title':   'Tout ce dont vous avez besoin',
    'landing.feat.label':   'Fonctionnalités',
    'landing.how.label':    'Comment ça marche',
    'landing.how.title':    'Simple en 3 étapes',
    'landing.step1.title':  'Créez votre compte',
    'landing.step1.desc':   'Inscrivez-vous gratuitement et accédez à votre tableau de bord personnalisé.',
    'landing.step2.title':  'Créez un examen',
    'landing.step2.desc':   'Ajoutez vos questions, définissez les bonnes réponses et activez l\'examen.',
    'landing.step3.title':  'Suivez les résultats',
    'landing.step3.desc':   'Les candidats passent le test et vous voyez les scores en temps réel.',
    'landing.cta.title':    'Prêt à commencer ?',
    'landing.cta.desc':     'Rejoignez ExamPlatform et créez votre premier examen en quelques minutes.',
    'landing.cta.btn':      'Créer un compte gratuit',
    'landing.cta.already':  'J\'ai déjà un compte',
    'landing.footer':       '© 2026 ExamPlatform. Tous droits réservés.',

    // Login / Register
    'login.title':          'Connexion',
    'login.email':          'Email',
    'login.password':       'Mot de passe',
    'login.btn':            'Se connecter',
    'login.loading':        'Connexion...',
    'login.error':          'Email ou mot de passe incorrect.',
    'login.no_account':     'Pas encore de compte ?',
    'login.register':       'S\'inscrire',
    'register.title':       'Créer un compte',
    'register.name':        'Nom complet',
    'register.btn':         'Créer mon compte',
    'register.loading':     'Création...',
    'register.error':       'Erreur lors de la création du compte.',
    'register.have_account':'Déjà un compte ?',

    // Dashboard
    'dashboard.title':      'Tableau de bord',
    'dashboard.welcome':    'Bienvenue,',
    'dashboard.new_exam':   '+ Nouvel examen',
    'dashboard.activated':  'Examens activés',
    'dashboard.created':    'En cours de création',
    'dashboard.suspended':  'Suspendus',
    'dashboard.total':      'Total examens',
    'dashboard.recent':     'Mes examens récents',
    'dashboard.empty':      'Vous n\'avez pas encore créé d\'examen.',
    'dashboard.first':      'Créer mon premier examen',
    'dashboard.popular':    'Examens populaires',
    'dashboard.loading':    'Chargement...',
    'dashboard.see':        'Voir',
    'dashboard.edit':       'Modifier',
    'dashboard.questions':  'questions',

    // Exams
    'exams.title':          'Examens',
    'exams.found':          'examen(s) trouvé(s)',
    'exams.new':            '+ Nouvel examen',
    'exams.search':         'Rechercher par code ou description...',
    'exams.all_status':     'Tous les statuts',
    'exams.loading':        'Chargement des examens...',
    'exams.empty':          'Aucun examen trouvé.',
    'exams.code':           'Code',
    'exams.desc':           'Description',
    'exams.questions':      'Questions',
    'exams.status':         'Statut',
    'exams.date':           'Date',
    'exams.actions':        'Actions',
    'exams.delete_confirm': 'Supprimer cet examen ?',

    // Statuts
    'status.CREATED':       'Créé',
    'status.ACTIVATED':     'Activé',
    'status.SUSPENDED':     'Suspendu',

    // Exam Form
    'form.edit_title':      'Modifier l\'examen',
    'form.new_title':       'Nouvel examen',
    'form.edit_sub':        'Modifier les informations',
    'form.new_sub':         'Créez votre examen avec questions et réponses',
    'form.back':            '← Retour',
    'form.general':         'Informations générales',
    'form.description':     'Description',
    'form.desc_ph':         'Description de l\'examen',
    'form.status':          'Statut',
    'form.questions':       'Questions',
    'form.no_questions':    'Aucune question. Cliquez sur le bouton ci-dessous pour commencer.',
    'form.q_content':       'Contenu de la question',
    'form.q_ph':            'Écrivez votre question ici...',
    'form.q_desc':          'Description (optionnelle)',
    'form.q_desc_ph':       'Indice ou explication...',
    'form.answers':         'Réponses',
    'form.answer_ph':       'Contenu de la réponse',
    'form.correct':         '✓ Correcte',
    'form.wrong':           '✗ Incorrecte',
    'form.add_answer':      '+ Ajouter une réponse',
    'form.add_question':    '+ Ajouter une question',
    'form.save_q':          '💾 Enregistrer la question',
    'form.maj_q':           '✎ MAJ question',
    'form.saving':          '⏳ Enregistrement...',
    'form.saved':           '✓ Enregistré !',
    'form.error_state':     '✗ Erreur',
    'form.cancel':          'Annuler',
    'form.update_exam':     'Mettre à jour l\'examen',
    'form.create_exam':     'Créer l\'examen',
    'form.loading_state':   'Enregistrement...',

    // Users
    'users.title':          'Utilisateurs',
    'users.add':            '+ Ajouter',
    'users.new_title':      'Nouvel utilisateur',
    'users.edit_title':     'Modifier l\'utilisateur',
    'users.name':           'Nom',
    'users.email':          'Email',
    'users.password':       'Mot de passe',
    'users.name_ph':        'Nom complet',
    'users.email_ph':       'email@exemple.com',
    'users.pass_ph':        '••••••••',
    'users.cancel':         'Annuler',
    'users.create':         'Créer',
    'users.update':         'Mettre à jour',
    'users.loading':        'Chargement...',
    'users.delete_confirm': 'Supprimer cet utilisateur ?',
  },

  ar: {
    // Navbar
    'nav.dashboard':     'لوحة التحكم',
    'nav.exams':         'الامتحانات',
    'nav.users':         'المستخدمون',
    'nav.login':         'تسجيل الدخول',
    'nav.logout':        'تسجيل الخروج',

    // Landing
    'landing.badge':        '🎓 منصة الامتحانات الإلكترونية',
    'landing.title1':       'أنشئ وأدر واجتز',
    'landing.title2':       'امتحاناتك',
    'landing.title3':       'بكل سهولة',
    'landing.subtitle':     'تتيح لك ExamPlatform إنشاء امتحانات بأسئلة وأجوبة ومشاركتها مع طلابك ومتابعة أدائهم في الوقت الفعلي.',
    'landing.start':        'ابدأ مجاناً ←',
    'landing.signin':       'تسجيل الدخول',
    'landing.stat1':        'عبر الإنترنت',
    'landing.stat2':        'امتحانات',
    'landing.stat3':        'تفاعلي',
    'landing.feat.title':   'كل ما تحتاجه',
    'landing.feat.label':   'المميزات',
    'landing.how.label':    'كيف يعمل',
    'landing.how.title':    'بسيط في 3 خطوات',
    'landing.step1.title':  'أنشئ حسابك',
    'landing.step1.desc':   'سجّل مجاناً وادخل إلى لوحة التحكم الخاصة بك.',
    'landing.step2.title':  'أنشئ امتحاناً',
    'landing.step2.desc':   'أضف أسئلتك وحدد الإجابات الصحيحة وفعّل الامتحان.',
    'landing.step3.title':  'تابع النتائج',
    'landing.step3.desc':   'يؤدي المرشحون الاختبار وترى النتائج في الوقت الفعلي.',
    'landing.cta.title':    'هل أنت مستعد للبدء؟',
    'landing.cta.desc':     'انضم إلى ExamPlatform وأنشئ امتحانك الأول في دقائق.',
    'landing.cta.btn':      'إنشاء حساب مجاني',
    'landing.cta.already':  'لدي حساب بالفعل',
    'landing.footer':       '© 2026 ExamPlatform. جميع الحقوق محفوظة.',

    // Login / Register
    'login.title':          'تسجيل الدخول',
    'login.email':          'البريد الإلكتروني',
    'login.password':       'كلمة المرور',
    'login.btn':            'تسجيل الدخول',
    'login.loading':        'جارٍ الدخول...',
    'login.error':          'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    'login.no_account':     'ليس لديك حساب؟',
    'login.register':       'إنشاء حساب',
    'register.title':       'إنشاء حساب',
    'register.name':        'الاسم الكامل',
    'register.btn':         'إنشاء حسابي',
    'register.loading':     'جارٍ الإنشاء...',
    'register.error':       'حدث خطأ أثناء إنشاء الحساب.',
    'register.have_account':'لديك حساب بالفعل؟',

    // Dashboard
    'dashboard.title':      'لوحة التحكم',
    'dashboard.welcome':    'مرحباً،',
    'dashboard.new_exam':   '+ امتحان جديد',
    'dashboard.activated':  'الامتحانات المفعّلة',
    'dashboard.created':    'قيد الإنشاء',
    'dashboard.suspended':  'موقوفة',
    'dashboard.total':      'إجمالي الامتحانات',
    'dashboard.recent':     'امتحاناتي الأخيرة',
    'dashboard.empty':      'لم تقم بإنشاء أي امتحان بعد.',
    'dashboard.first':      'إنشاء امتحاني الأول',
    'dashboard.popular':    'الامتحانات الشائعة',
    'dashboard.loading':    'جارٍ التحميل...',
    'dashboard.see':        'عرض',
    'dashboard.edit':       'تعديل',
    'dashboard.questions':  'أسئلة',

    // Exams
    'exams.title':          'الامتحانات',
    'exams.found':          'امتحان(ات) موجودة',
    'exams.new':            '+ امتحان جديد',
    'exams.search':         'البحث بالكود أو الوصف...',
    'exams.all_status':     'جميع الحالات',
    'exams.loading':        'جارٍ تحميل الامتحانات...',
    'exams.empty':          'لم يتم العثور على أي امتحان.',
    'exams.code':           'الكود',
    'exams.desc':           'الوصف',
    'exams.questions':      'الأسئلة',
    'exams.status':         'الحالة',
    'exams.date':           'التاريخ',
    'exams.actions':        'الإجراءات',
    'exams.delete_confirm': 'حذف هذا الامتحان؟',

    // Statuts
    'status.CREATED':       'تم الإنشاء',
    'status.ACTIVATED':     'مفعّل',
    'status.SUSPENDED':     'موقوف',

    // Exam Form
    'form.edit_title':      'تعديل الامتحان',
    'form.new_title':       'امتحان جديد',
    'form.edit_sub':        'تعديل المعلومات',
    'form.new_sub':         'أنشئ امتحانك بأسئلة وأجوبة',
    'form.back':            'رجوع ←',
    'form.general':         'المعلومات العامة',
    'form.description':     'الوصف',
    'form.desc_ph':         'وصف الامتحان',
    'form.status':          'الحالة',
    'form.questions':       'الأسئلة',
    'form.no_questions':    'لا توجد أسئلة. انقر على الزر أدناه للبدء.',
    'form.q_content':       'محتوى السؤال',
    'form.q_ph':            'اكتب سؤالك هنا...',
    'form.q_desc':          'الوصف (اختياري)',
    'form.q_desc_ph':       'تلميح أو شرح...',
    'form.answers':         'الإجابات',
    'form.answer_ph':       'محتوى الإجابة',
    'form.correct':         '✓ صحيحة',
    'form.wrong':           '✗ خاطئة',
    'form.add_answer':      '+ إضافة إجابة',
    'form.add_question':    '+ إضافة سؤال',
    'form.save_q':          '💾 حفظ السؤال',
    'form.maj_q':           '✎ تحديث السؤال',
    'form.saving':          '⏳ جارٍ الحفظ...',
    'form.saved':           '✓ تم الحفظ!',
    'form.error_state':     '✗ خطأ',
    'form.cancel':          'إلغاء',
    'form.update_exam':     'تحديث الامتحان',
    'form.create_exam':     'إنشاء الامتحان',
    'form.loading_state':   'جارٍ الحفظ...',

    // Users
    'users.title':          'المستخدمون',
    'users.add':            '+ إضافة',
    'users.new_title':      'مستخدم جديد',
    'users.edit_title':     'تعديل المستخدم',
    'users.name':           'الاسم',
    'users.email':          'البريد الإلكتروني',
    'users.password':       'كلمة المرور',
    'users.name_ph':        'الاسم الكامل',
    'users.email_ph':       'email@example.com',
    'users.pass_ph':        '••••••••',
    'users.cancel':         'إلغاء',
    'users.create':         'إنشاء',
    'users.update':         'تحديث',
    'users.loading':        'جارٍ التحميل...',
    'users.delete_confirm': 'حذف هذا المستخدم؟',
  }
};

@Injectable({ providedIn: 'root' })
export class LangService {
  lang = signal<Lang>(
    (localStorage.getItem('lang') as Lang) ?? 'fr'
  );

  toggle() {
    const next: Lang = this.lang() === 'fr' ? 'ar' : 'fr';
    this.lang.set(next);
    localStorage.setItem('lang', next);
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = next;
  }

  t(key: string): string {
    return TRANSLATIONS[this.lang()][key] ?? key;
  }

  get isRtl(): boolean {
    return this.lang() === 'ar';
  }
}
