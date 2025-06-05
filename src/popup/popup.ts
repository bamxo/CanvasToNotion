import { signInWithEmail } from '../services/firebase/config';
// import { signInWithEmail, signInWithGoogle } from '../services/firebase/config';

document.getElementById('loginEmailBtn')!.addEventListener('click', async () => {
  const email = (document.getElementById('email') as HTMLInputElement).value;
  const password = (document.getElementById('password') as HTMLInputElement).value;
  try {
    const user = await signInWithEmail(email, password);
    (document.getElementById('status') as HTMLElement).textContent = `Logged in as ${user.email}`;
  } catch (error) {
    (document.getElementById('status') as HTMLElement).textContent = `Error: ${(error as Error).message}`;
  }
});

