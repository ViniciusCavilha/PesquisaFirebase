# Pesquisa Prática — Ionic, Vue, Capacitor e Firebase

Aplicativo com login, recuperação de senha, perfil no Cloud Firestore, foto no Firebase Storage e tela de boas-vindas.

## Configuração do Firebase

1. Crie um projeto em [Firebase Console](https://console.firebase.google.com/).
2. Adicione um aplicativo Web e copie a configuração dele.
3. Ative **Authentication > Sign-in method > Email/Password**.
4. Crie o **Cloud Firestore** em modo de produção e ative o **Storage**.
5. Copie `.env.firebase.example` para `.env` e preencha os seis valores da configuração Web.
6. Publique `firestore.rules` e `storage.rules` nas telas **Firestore > Rules** e **Storage > Rules**.

Não coloque arquivos `.env` no Git. A configuração Web pode aparecer no frontend; a segurança vem das Rules. Nunca publique uma chave de conta de serviço.

## Executar

```sh
npm install
npm run dev
```

As contas ficam no Authentication; os perfis ficam em `profiles/{uid}`; as imagens ficam em `users/{uid}/avatar.ext`.

Para o reset, o Firebase envia o e-mail pelo template configurado no Console. Adicione `localhost` em **Authentication > Settings > Authorized domains**.

## Verificação

```sh
npm run build
npm run lint
npm run test:unit -- --run
```

O build web não é um APK. Capacitor continua configurado para empacotar a aplicação depois que o build estiver pronto.

