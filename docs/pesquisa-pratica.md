# Pesquisa Prática: Ionic, Vue, Capacitor e Firebase

## Objetivo

Aplicar a pesquisa teórica em uma aplicação móvel de cadastro. O sistema possui login, recuperação de senha, tela de perfil e tela de boas-vindas para o usuário autenticado.

## Arquitetura

Ionic fornece os componentes da interface. Vue controla os estados e formulários. Capacitor prepara o build para Android e iOS. Firebase fornece:

- Authentication: cadastro, login, sessão e recuperação de senha.
- Cloud Firestore: documento `profiles/{uid}` com nome, nascimento, nickname e caminho da foto.
- Storage: foto em `users/{uid}/avatar.ext`.

O ID do usuário autenticado é usado tanto no documento quanto na pasta da foto. As Rules limitam cada operação ao dono.

## Fluxo principal

O formulário chama `signInWithEmailAndPassword`. `onAuthStateChanged` atualiza a tela quando a sessão muda. Depois do login, `getDoc` busca o perfil. Ao salvar, `uploadBytes` envia a imagem e `setDoc` grava os campos no Firestore. `getDownloadURL` prepara a imagem para a tela de boas-vindas.

Na recuperação, `sendPasswordResetEmail` envia o link. A nova senha é definida na página de ação do Firebase.

## Segurança

O Firestore permite ler e escrever apenas quando `request.auth.uid` é igual ao ID do documento. O Storage permite acessar apenas arquivos da pasta do usuário e limita fotos a 2 MB nos formatos JPG, PNG e WebP. A configuração Web não substitui as Rules.

## Teste manual

1. Criar uma conta com e-mail e senha.
2. Entrar e verificar a tela de boas-vindas.
3. Preencher nome, data e nickname e salvar.
4. Escolher uma foto e salvar novamente.
5. Recarregar a página e confirmar os dados.
6. Sair e testar o link de recuperação.

A aplicação valida nome, data, nickname e arquivo antes de enviar. A validação real exige um projeto Firebase configurado e as Rules publicadas.

