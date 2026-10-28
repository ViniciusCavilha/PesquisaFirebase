# Como entender o código

`src/lib/firebase.ts` cria a conexão com o projeto. `src/views/HomePage.vue` tem os formulários e as funções dos botões. `src/lib/validation.ts` verifica os dados antes do envio. `firestore.rules` e `storage.rules` protegem os dados no Firebase.

No Vue, `ref` guarda valores simples que mudam na tela, como e-mail e senha. `reactive` guarda o objeto do perfil. `v-model` liga um campo à variável, `v-if` mostra uma tela somente quando uma condição é verdadeira e `@submit.prevent` chama uma função sem recarregar a página.

Quando o usuário entra, `signInWithEmailAndPassword` envia o e-mail e a senha ao Firebase Authentication. `onAuthStateChanged` avisa quando a sessão mudou. A aplicação então busca `profiles/{uid}` com `getDoc`.

Ao salvar o perfil, `uploadBytes` envia a foto para `users/{uid}/avatar.ext`. Depois, `setDoc` grava nome, data, nickname e o caminho da foto no Firestore. `getDownloadURL` fornece o endereço para mostrar a imagem.

O botão de recuperação chama `sendPasswordResetEmail`. O Firebase envia o link de redefinição conforme o template configurado no Console.

O `try/catch` trata erros. `busy` desativa os botões durante uma operação. As Rules usam o `uid` da sessão para impedir que uma conta acesse o perfil ou a foto de outra.

