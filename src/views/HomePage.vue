<template>
  <ion-page>
    <ion-header
      ><ion-toolbar><ion-title>Cadastro de usuário</ion-title></ion-toolbar></ion-header
    >
    <ion-content>
      <main class="layout">
        <header class="intro">
          <h1>Cadastro de usuário</h1>
          <p>Pesquisa prática com Ionic, Vue, Capacitor e Firebase.</p>
        </header>
        <section class="panel" :aria-busy="busy || loading">
          <p v-if="!firebaseReady" class="notice">Configure o arquivo .env com os dados do seu projeto Firebase.</p>
          <p v-if="loading" role="status">Carregando sua sessão...</p>
          <p v-if="message" class="notice" role="status">{{ message }}</p>
          <p v-if="error" class="error" role="alert">{{ error }}</p>
          <template v-if="!loading && !user">
            <h2>{{ formTitle }}</h2>
            <form @submit.prevent="authenticate">
              <label v-if="mode !== 'recovery'"
                >E-mail<input
                  v-model.trim="email"
                  type="email"
                  autocomplete="email"
                  required
                  maxlength="254"
                  :disabled="busy"
              /></label>
              <label v-if="(mode !== 'recovery' && mode !== 'reset') || mode === 'recovery'"
                >{{ mode === 'recovery' ? 'Nova senha' : 'Senha'
                }}<input
                  v-model="password"
                  type="password"
                  autocomplete="new-password"
                  required
                  minlength="8"
                  :disabled="busy"
                /><small>Mínimo de 8 caracteres.</small></label
              >
              <label v-if="mode === 'signup' || mode === 'recovery'"
                >Confirme a senha<input
                  v-model="confirmation"
                  type="password"
                  autocomplete="new-password"
                  required
                  minlength="8"
                  :disabled="busy"
              /></label>
              <ion-button type="submit" expand="block" :disabled="busy || !firebaseReady">{{ submitLabel }}</ion-button>
            </form>
            <div v-if="mode !== 'recovery'" class="links">
              <button v-if="mode === 'login'" @click="changeMode('reset')" :disabled="busy">Esqueci minha senha</button
              ><button @click="changeMode(mode === 'login' ? 'signup' : 'login')" :disabled="busy">
                {{ mode === 'login' ? 'Criar uma conta' : 'Voltar para o login' }}
              </button>
            </div>
          </template>
          <template v-else-if="!loading && user">
            <nav aria-label="Área do usuário">
              <button @click="tab = 'welcome'" :aria-current="tab === 'welcome' ? 'page' : undefined">Início</button
              ><button @click="tab = 'profile'" :aria-current="tab === 'profile' ? 'page' : undefined">
                Meu perfil</button
              ><button @click="logout" :disabled="busy">Sair</button>
            </nav>
            <template v-if="tab === 'welcome'"
              ><div class="avatar">
                <img v-if="avatarUrl" :src="avatarUrl" alt="Sua foto de perfil" /><span v-else>{{
                  (profile.name || user.email || 'U').charAt(0).toUpperCase()
                }}</span>
              </div>
              <h2>Bem-vindo{{ profile.name ? `, ${profile.name}` : '' }}!</h2>
              <p class="muted">
                {{ profile.nickname ? `@${profile.nickname}` : 'Preencha seus dados na tela de perfil.' }}
              </p>
              <p class="account">{{ user.email }}</p>
              <ion-button expand="block" @click="tab = 'profile'">Editar meu perfil</ion-button></template
            >
            <template v-else
              ><h2>Seu perfil</h2>
              <p class="muted">Conte um pouco sobre você.</p>
              <form @submit.prevent="saveProfile">
                <div class="avatar">
                  <img v-if="avatarUrl" :src="avatarUrl" alt="Sua foto de perfil" /><span v-else>{{
                    (profile.name || 'U').charAt(0).toUpperCase()
                  }}</span>
                </div>
                <label
                  >Foto de perfil<input
                    :key="fileInputKey"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    @change="selectPhoto"
                    :disabled="busy"
                  /><small>JPG, PNG ou WebP, até 2 MB.</small></label
                ><label
                  >Nome<input
                    v-model="profile.name"
                    autocomplete="name"
                    required
                    minlength="2"
                    maxlength="100"
                    :disabled="busy" /></label
                ><label
                  >Data de nascimento<input
                    v-model="birthDateInput"
                    type="text"
                    inputmode="numeric"
                    placeholder="DD/MM/AAAA"
                    maxlength="10"
                    pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}"
                    required
                    @input="formatBirthDate"
                    :disabled="busy"
                  /><small>Digite dia, mês e ano. Exemplo: 15/08/2008.</small></label
                ><label
                  >Nickname<input
                    v-model.trim="profile.nickname"
                    autocomplete="nickname"
                    required
                    minlength="3"
                    maxlength="30"
                    pattern="[a-zA-Z0-9_]{3,30}"
                    :disabled="busy"
                  /><small>Letras, números e sublinhado, sem espaços.</small></label
                ><ion-button type="submit" expand="block" :disabled="busy">{{
                  busy ? 'Salvando...' : 'Salvar perfil'
                }}</ion-button>
              </form></template
            >
          </template>
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { IonButton, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
import { auth, db, firebaseReady, storage } from '../lib/firebase';
import { validatePhoto, validateProfile } from '../lib/validation';

const user = ref<User | null>(null);
const mode = ref<'login' | 'signup' | 'reset' | 'recovery'>('login');
const tab = ref<'welcome' | 'profile'>('welcome');
const loading = ref(true),
  busy = ref(false),
  error = ref(''),
  message = ref('');
const email = ref(''),
  password = ref(''),
  confirmation = ref(''),
  photo = ref<File | null>(null),
  avatarUrl = ref(''),
  fileInputKey = ref(0),
  birthDateInput = ref('');
const profile = reactive({ name: '', birth_date: '', nickname: '', avatar_path: '', avatar_data: '' });
let stopAuth: (() => void) | undefined;

const formTitle = computed(() =>
  mode.value === 'signup'
    ? 'Criar conta'
    : mode.value === 'reset'
      ? 'Recuperar senha'
      : mode.value === 'recovery'
        ? 'Redefina sua senha'
        : 'Login',
);
const submitLabel = computed(() =>
  busy.value
    ? 'Aguarde...'
    : mode.value === 'signup'
      ? 'Criar conta'
      : mode.value === 'reset'
        ? 'Enviar link'
        : mode.value === 'recovery'
          ? 'Salvar nova senha'
          : 'Entrar',
);
function changeMode(next: typeof mode.value) {
  mode.value = next;
  error.value = '';
  message.value = '';
  password.value = '';
  confirmation.value = '';
}
function showError(value: unknown) {
  const code = (value as { code?: string })?.code || '';
  error.value =
    code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')
      ? 'E-mail ou senha incorretos.'
      : code.includes('email-already-in-use')
        ? 'Este e-mail já está cadastrado.'
        : code.includes('weak-password')
          ? 'A senha deve ter pelo menos 8 caracteres.'
          : `Não foi possível concluir: ${(value as { message?: string })?.message || 'tente novamente.'}`;
}
function formatBirthDate(event: Event) {
  const input = event.target as HTMLInputElement;
  const digits = input.value.replace(/\D/g, '').slice(0, 8);
  let formatted = digits.slice(0, 2);
  if (digits.length > 2) formatted += '/' + digits.slice(2, 4);
  if (digits.length > 4) formatted += '/' + digits.slice(4, 8);
  birthDateInput.value = formatted;
  input.value = formatted;
}
async function loadProfile(uid: string) {
  if (!db) return;
  const snapshot = await getDoc(doc(db, 'profiles', uid));
  const imageSnapshot = await getDoc(doc(db, 'images', uid));
  Object.assign(
    profile,
    snapshot.exists()
      ? {
          ...snapshot.data(),
          avatar_path: snapshot.data().avatar_path || '',
          avatar_data: snapshot.data().avatar_data || '',
        }
      : { name: '', birth_date: '', nickname: '', avatar_path: '', avatar_data: '' },
  );
  birthDateInput.value = profile.birth_date.split('-').reverse().join('/');
  profile.avatar_data = imageSnapshot.exists() ? String(imageSnapshot.data().image || '') : '';
  avatarUrl.value = profile.avatar_data;
  if (!avatarUrl.value && profile.avatar_path && storage) {
    avatarUrl.value = await getDownloadURL(storageRef(storage, profile.avatar_path)).catch(() => '');
  }
}
onMounted(() => {
  if (!auth) {
    loading.value = false;
    return;
  }
  stopAuth = onAuthStateChanged(auth, (current) => {
    user.value = current;
    if (current) loadProfile(current.uid).catch(showError);
    else {
      Object.assign(profile, { name: '', birth_date: '', nickname: '', avatar_path: '', avatar_data: '' });
      birthDateInput.value = '';
      avatarUrl.value = '';
    }
    loading.value = false;
  });
});
onUnmounted(() => stopAuth?.());

async function authenticate() {
  if (!auth || busy.value) return;
  busy.value = true;
  error.value = '';
  message.value = '';
  try {
    if ((mode.value === 'signup' || mode.value === 'recovery') && password.value !== confirmation.value)
      throw new Error('As senhas não coincidem.');
    if (mode.value === 'reset') {
      await sendPasswordResetEmail(auth, email.value);
      message.value = 'Se o e-mail estiver cadastrado, você receberá o link de recuperação.';
    } else if (mode.value === 'signup') {
      await createUserWithEmailAndPassword(auth, email.value, password.value);
      message.value = 'Conta criada! Complete seu perfil.';
    } else if (mode.value === 'recovery') {
      if (!auth.currentUser) throw new Error('Abra o link de recuperação recebido por e-mail.');
      await updatePassword(auth.currentUser, password.value);
      changeMode('login');
      message.value = 'Senha atualizada com sucesso.';
    } else {
      await signInWithEmailAndPassword(auth, email.value, password.value);
      tab.value = 'welcome';
    }
    password.value = '';
    confirmation.value = '';
  } catch (e) {
    showError(e);
  } finally {
    busy.value = false;
  }
}
function selectPhoto(event: Event) {
  const input = event.target as HTMLInputElement;
  const selected = input.files?.[0];
  if (!selected) return;
  const invalid = validatePhoto(selected);
  if (invalid) {
    error.value = invalid;
    input.value = '';
    return;
  }
  error.value = '';
  photo.value = selected;
}
function compressPhoto(file: File) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      const scale = Math.min(1, 600 / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const data = canvas.toDataURL('image/jpeg', 0.75);
      if (data.length > 900000) reject(new Error('A foto ainda ficou grande. Escolha uma imagem menor.'));
      else resolve(data);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível ler a foto.'));
    };
    image.src = url;
  });
}
async function saveProfile() {
  if (!db || !user.value || busy.value) return;
  busy.value = true;
  error.value = '';
  message.value = '';
  try {
    profile.birth_date = birthDateInput.value.split('/').reverse().join('-');
    const invalid = validateProfile(profile.name, profile.birth_date, profile.nickname);
    if (invalid) throw new Error(invalid);
    let path = profile.avatar_path;
    let avatarData = '';
    const oldPath = profile.avatar_path;
    if (photo.value) {
      avatarData = await compressPhoto(photo.value);
      path = '';
    }
    if (photo.value && avatarData === '' && storage) {
      if (!storage) throw new Error('O armazenamento de fotos ainda não está configurado no Firebase.');
      const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[photo.value.type];
      path = `users/${user.value.uid}/avatar.${extension}`;
      await Promise.race([
        uploadBytes(storageRef(storage, path), photo.value, { contentType: photo.value.type }),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('O upload demorou demais. Verifique se o Firebase Storage foi ativado.')),
            15000,
          ),
        ),
      ]);
    }
    await Promise.race([
      setDoc(doc(db, 'profiles', user.value.uid), {
        name: profile.name.trim(),
        birth_date: profile.birth_date,
        nickname: profile.nickname,
        avatar_path: path || null,
        updated_at: new Date(),
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('O salvamento demorou demais. Verifique o Firestore e sua conexão.')), 15000),
      ),
    ]);
    if (photo.value) {
      await setDoc(doc(db, 'images', user.value.uid), { image: avatarData });
    }
    if (oldPath && oldPath !== path && storage) await deleteObject(storageRef(storage, oldPath)).catch(() => undefined);
    profile.avatar_path = path;
    profile.avatar_data = avatarData;
    photo.value = null;
    fileInputKey.value++;
    message.value = 'Perfil salvo com sucesso!';
    await loadProfile(user.value.uid);
  } catch (e) {
    showError(e);
  } finally {
    busy.value = false;
  }
}
async function logout() {
  if (!auth || busy.value) return;
  busy.value = true;
  try {
    await signOut(auth);
    changeMode('login');
    tab.value = 'welcome';
  } catch (e) {
    showError(e);
  } finally {
    busy.value = false;
  }
}
</script>
