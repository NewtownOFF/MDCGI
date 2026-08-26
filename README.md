# Médecin GI

Dashboard Next.js + Supabase, déployable sur Vercel. Auth Discord. Rôles :
Inconnu → Médecin → Médecin Distingué → Co-Gérant Médecin → Gérant Médecin.

## ⚠️ Règle critique — à lire avant tout déploiement

**Le tout premier compte qui se connecte devient automatiquement Gérant Médecin,
avec tous les droits (rôles, validation, liens).** Il n'y a pas de deuxième
vérification. Donc :

1. Déploie l'app.
2. Configure Supabase + Discord (étapes ci-dessous).
3. **Connecte-toi TOI-MÊME en premier, immédiatement**, avant de partager l'URL
   avec qui que ce soit.
4. Seulement après, partage le lien aux autres.

Si quelqu'un d'autre se connecte avant toi, c'est lui le Gérant, pas toi — et il
n'existe aucun moyen de le rétrograder depuis l'interface (le rôle Gérant est
immuable par design). Il faudrait alors modifier la ligne directement dans la
table `profiles` via l'éditeur SQL de Supabase.

## 1. Créer le projet Supabase

1. Va sur https://supabase.com → New Project.
2. Une fois créé, va dans **SQL Editor** → colle le contenu de
   `supabase/schema.sql` → Run.
3. Puis colle et exécute `supabase/schema-announcements.sql` (Centre d'annonces —
   table `announcements` + `announcement_reads`, avec RLS : lecture pour tous
   les connectés, écriture réservée aux Gérant/Co-Gérant).
3. Va dans **Project Settings → API** : note `Project URL` et `anon public key`
   (pour `.env`).
4. Va dans **Project Settings → API → service_role key** : note-la aussi
   (utilisée uniquement côté serveur, jamais exposée au client).

## 2. Créer l'application Discord (pour l'OAuth)

1. https://discord.com/developers/applications → New Application.
2. Onglet **OAuth2** → note le `Client ID` et génère/copie le `Client Secret`.
3. Dans **OAuth2 → Redirects**, ajoute l'URL de callback que Supabase te donne
   à l'étape suivante (format : `https://<ton-projet>.supabase.co/auth/v1/callback`).

## 3. Activer Discord dans Supabase Auth

1. Supabase Dashboard → **Authentication → Providers → Discord** → Enable.
2. Colle le `Client ID` et le `Client Secret` de Discord.
3. Dans **Authentication → URL Configuration**, mets ton URL Vercel (ou
   `http://localhost:3000` en dev) dans "Site URL" et "Redirect URLs".

## 4. Variables d'environnement

Copie `.env.example` → `.env.local` et remplis avec les valeurs récupérées :

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=...
```

## 5. Développement local

```bash
npm install
npm run dev
```

## 6. Déploiement sur Vercel

1. Pousse ce projet sur un repo GitHub.
2. Sur https://vercel.com → **Add New → Project** → importe le repo.
3. Dans **Settings → Environment Variables**, ajoute les mêmes variables que
   `.env.local`.
4. Deploy.
5. Une fois l'URL Vercel connue, retourne dans Supabase
   **Authentication → URL Configuration** et mets à jour "Site URL" /
   "Redirect URLs" avec l'URL réelle de production (et dans Discord OAuth2 si
   nécessaire).
6. **Connecte-toi en premier** (voir section ⚠️ ci-dessus).

## Structure des rôles

| Rôle | Peut poster sur Flex | Peut valider/rejeter | Peut gérer les liens | Peut gérer les rôles |
|---|---|---|---|---|
| Inconnu | non | non | non | non |
| Médecin | oui | non | non | non |
| Médecin Distingué | oui | non | non | non |
| Co-Gérant Médecin | oui | oui | oui | oui (sauf Gérant/Co-Gérant) |
| Gérant Médecin (unique) | oui | oui | oui | oui (tous les rôles) |

Toute cette logique est appliquée **au niveau de la base de données (RLS +
fonction `admin_set_role`)**, pas seulement dans l'interface — donc même un
appel API bricolé à la main ne peut pas contourner les permissions.
