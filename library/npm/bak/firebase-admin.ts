import * as fs from "fs";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as utility from "../src/utility";
import { Bucket } from "@google-cloud/storage";
export const firestore: any = {};
export const storage: any = {};

let bucket: Bucket;
export const init = (serviceAccount: any) => {
  if (admin.apps.length) {
  } else
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  firestore.db = admin.firestore();
  const storage = admin.storage();
  const bucketName = serviceAccount.project_id + ".appspot.com";
  bucket = storage.bucket(bucketName);
};

firestore.set = async (path: string, object: any) => {
  const array = path.split("/");
  if (array.length % 2) await firestore.db.collection(path).add(object);
  else await firestore.db.doc(path).set(object, { merge: true });
};

firestore.get = async (path: string) => {
  const array = path.split("/");
  if (array.length % 2) return await firestore.db.collection(path).get();
  else {
    const docRef = firestore.db.doc(path);
    return Promise.all([docRef.listCollections(), docRef.get()]).then(
      (result) => {
        return { collections: result[0], document: result[1] };
      }
    );
  }
};

firestore.update = async (path: string, object: any) => {
  const array = path.split("/");
  if (array.length % 2) {
  } else await firestore.db.doc(path).update(object);
};

firestore.delete = async (path: string) => {
  const array = path.split("/");
  if (array.length % 2) {
    const documents = await firestore.db.collection(path).listDocuments();
    for (const document of documents) {
      await firestore.delete(`${path}/${document.id}`);
    }
  } else {
    const docRef = firestore.db.doc(path);
    const collections = await docRef.listCollections();
    for (const collection of collections) {
      await firestore.delete(`${path}/${collection.id}`);
    }
    await docRef.delete();
  }
};

function createHeader(object: any, header = "") {
  let ret = "";
  let _header: string;
  const arr = Object.keys(object).sort().slice();
  arr.forEach((key) => {
    if (header == "") _header = key;
    else _header = `${header}[${key}]`;
    switch (object[key].constructor.name) {
      case "Object":
        _header = `${createHeader(object[key], _header)},`;
        break;
      case "Array":
        {
          let header = "";
          for (let i = 0; i < object[key].length; i++) {
            if (object[key][i].constructor.name == "Object") {
              header += `${createHeader(object[key][i], `${_header}[${i}]`)},`;
            } else header += `"${_header}[${i}]",`;
          }
          _header = `${header}`;
        }
        break;
      default:
        _header = `"${_header}",`;
    }
    ret += _header;
  });
  return ret.slice(0, -1);
}

function createBody(object: any) {
  let ret = "";
  let _body: string;
  const arr = Object.keys(object).sort().slice();
  arr.forEach((key) => {
    switch (object[key].constructor.name) {
      case "Object":
        _body = `${createBody(object[key])},`;
        break;
      case "Array":
        _body = "";
        for (let i = 0; i < object[key].length; i++) {
          switch (object[key][i].constructor.name) {
            case "Object":
              _body += `${createBody(object[key][i])},`;
              break;
            case "Number":
            case "Boolean":
              _body += `${object[key][i]},`;
              break;
            case "String":
              _body += `"${object[key][i]}",`;
              break;
            case "Timestamp":
              _body += `${utility.date.getDate(object[key][i].toDate()).str},`;
              break;
            case "GeoPoint":
              _body += `[${object[key][i].latitude}ﾟ:${object[key][i].longitude}ﾟ],`;
              break;
            case "DocumentReference":
              _body += `"${object[key][i].path}",`;
              break;
          }
        }
        break;
      case "Number":
      case "Boolean":
        _body = `${object[key]},`;
        break;
      case "String":
        _body = `"${object[key]}",`;
        break;
      case "Timestamp":
        _body = `${utility.date.getDate(object[key].toDate()).str},`;
        break;
      case "GeoPoint":
        _body = `[${object[key].latitude}ﾟ:${object[key].longitude}ﾟ],`;
        break;
      case "DocumentReference":
        _body = `"${object[key].path}",`;
        break;
    }
    ret += _body;
  });
  return ret.slice(0, -1);
}

firestore.backup = async (path = "") => {
  let ret = false;
  const docRef = path == "" ? firestore.db : firestore.db.doc(path);
  const collections = await docRef.listCollections();
  for (const collection of collections) {
    const documents = await collection.listDocuments();
    for (const document of documents) {
      if (await firestore.backup(`${collection.id}/${document.id}`)) {
      } else break;
    }
    const snapshot = await collection.get();
    if (snapshot.docs.length) {
      const data = snapshot.docs[0].data();
      if (Object.keys(data).length) {
        const array = path.split("/");
        let dir = "backup/";
        for (let i = 0; i < array.length; i++) {
          if (i % 2) dir += `${array[i]}/`;
        }
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        const fd = fs.openSync(`${dir}${collection.id}.csv`, "w");
        fs.writeSync(fd, `\ufeff${createHeader(data)}\n`);
        for (const doc of snapshot.docs) {
          fs.writeSync(fd, `${createBody(doc.data())}\n`);
        }
        fs.closeSync(fd);
        ret = true;
      }
    }
  }
  return ret;
};

storage.upload = async (path: string, destination: string) => {
  await bucket.upload(path, { destination: destination });
};

storage.save = async (
  buffer: any,
  contentType: string,
  destination: string
) => {
  await bucket.file(destination).save(buffer, { contentType: contentType });
};

storage.download = async (path: string, destination: string) => {
  await bucket.file(path).download({ destination: destination });
};

storage.getFiles = async (path: string) => {
  const [ret] = await bucket.getFiles({
    // autoPaginate: false,
    // delimiter: "/",
    prefix: path,
  });
  return ret;
};

storage.delete = async (path: string) => {
  await bucket.file(path).delete({ ignoreNotFound: true });
};

storage.backup = async (path = "") => {
  const files = await storage.getFiles(path);
  files.forEach((file: File) => {
    const array = file.name.split("/");
    let dir = "backup/";
    let destination = "";
    for (let i = 0; i < array.length; i++) {
      if (array[i] == "") break;
      else if (i == array.length - 1) destination = `${dir}${array[i]}`;
      else dir += `${array[i]}/`;
    }
    if (destination == "") {
    } else {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      storage.download(file.name, destination.replace(":", "-"));
    }
  });
};

storage.url = async (path: string) => {
  return await bucket
    .file(path)
    .getSignedUrl({ action: "read", expires: "12-31-9999" });
};
export { admin, functions };
