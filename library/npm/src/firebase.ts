import { FirebaseOptions, initializeApp } from "firebase/app";
import { Auth, getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { Functions, getFunctions } from "firebase/functions";
import { getStorage, FirebaseStorage } from "firebase/storage";
export * from "react-firebase-hooks/auth";
export * from "react-firebase-hooks/firestore";
export * from "react-firebase-hooks/functions";
export * from "react-firebase-hooks/messaging";
export * from "react-firebase-hooks/storage";

export let provider: GoogleAuthProvider;
export let auth: Auth;
export let firestore: Firestore;
export let functions: Functions;
export let storage: FirebaseStorage;
export const init = (config: FirebaseOptions, region: string) => {
  const app = initializeApp(config);
  provider = new GoogleAuthProvider();
  auth = getAuth(app);
  firestore = getFirestore(app);
  functions = getFunctions(app, region);
  storage = getStorage(app);
};
