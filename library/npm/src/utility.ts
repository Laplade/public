export const date: any = {};
date.getDate = (_date: string | Date): any => {
  if (typeof _date == "string") {
    const year = Number(_date.slice(0, 4));
    const month = Number(_date.slice(5, 7)) - 1;
    const day = Number(_date.slice(8, 10));
    const hour = Number(_date.slice(11, 13));
    const minute = Number(_date.slice(14, 16));
    const second = Number(_date.slice(17, 19));
    return date.getDate(new Date(year, month, day, hour, minute, second));
  } else if (typeof _date == "object" && _date.constructor.name == "Date") {
    return {
      datetime: _date,
      year: _date.getFullYear(),
      month: _date.getMonth() + 1,
      date: _date.getDate(),
      hours: _date.getHours(),
      minutes: _date.getMinutes(),
      seconds: _date.getSeconds(),
      year_str: "" + _date.getFullYear(),
      month_str: ("0" + (_date.getMonth() + 1)).slice(-2),
      date_str: ("0" + _date.getDate()).slice(-2),
      hours_str: ("0" + _date.getHours()).slice(-2),
      minutes_str: ("0" + _date.getMinutes()).slice(-2),
      seconds_str: ("0" + _date.getSeconds()).slice(-2),
      dayofweek: _date.getDay(),
      str:
        "" +
        _date.getFullYear() +
        "-" +
        ("0" + (_date.getMonth() + 1)).slice(-2) +
        "-" +
        ("0" + _date.getDate()).slice(-2) +
        " " +
        ("0" + _date.getHours()).slice(-2) +
        ":" +
        ("0" + _date.getMinutes()).slice(-2) +
        ":" +
        ("0" + _date.getSeconds()).slice(-2),
    };
  }
};
date.getNow = (ms = 1000) =>
  (date.now = date.getDate(
    new Date(Math.floor(new Date().getTime() / ms) * ms)
  ));
export const wait = async (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
export const timeout = async (ms: number) =>
  new Promise((resolve, reject) => setTimeout(reject, ms));
export const timeoutPromise = async (promise: Promise<unknown>, ms: number) =>
  await Promise.race([promise, timeout(ms)]);
export const isNum = (value: any) => !isNaN(value);
export const float32ToUint32 = (value: number) =>
  new Uint32Array(Float32Array.from([value]).buffer)[0];
export const uint32ToFloat32 = (value: number) =>
  new Float32Array(Uint32Array.from([value]).buffer)[0];
export const hexStrToUint = (str: string) => {
  let ret = 0;
  const size = str.length / 2;
  for (let i = 0; i < size; i++) {
    ret += parseInt(str.slice(i * 2, i * 2 + 2), 16) * 256 ** i;
  }
  return ret;
};
export const uintToHexStr = (value: number, byte: number) => {
  let ret = "";
  for (let i = 0; i < byte; i++) {
    ret += ("00" + Math.floor(value / 256 ** i).toString(16)).slice(-2);
  }
  return ret.toUpperCase();
};
export const strToBcc = (str: string) => {
  let ret = 0;
  const size = str.length / 2;
  for (let i = 0; i < size; i++) {
    ret ^= parseInt(str.slice(i * 2, i * 2 + 2), 16);
  }
  return ret;
};

export const parallels = (ps = new Set<Promise<unknown>>()) => ({
  add: (p: Promise<unknown>) =>
    ps.add(!!p.then(() => ps.delete(p)).catch(() => ps.delete(p)) && p),
  wait: (limit: number) => ps.size >= limit && Promise.race(ps),
  all: () => Promise.all(ps),
});

export const getGrantedHandles = async (
  items: any,
  files: boolean,
  directorys: boolean
) => {
  const handles = await Promise.all(
    Object.values(items).map((item: any) => item.getAsFileSystemHandle())
  );
  const fileHandles: any = [];
  const directoryHandles: any = [];
  handles.forEach((handle: any) => {
    if (handle.kind == "file") fileHandles.push(handle);
    else if (handle.kind == "directory") directoryHandles.push(handle);
  });
  const grantedFileHandles: any = [];
  const grantedDirectoryHandles: any = [];

  // ファイル
  if (files) {
    await Promise.all(
      fileHandles.map((handle: any) =>
        handle.requestPermission({ mode: "readwrite" })
      )
    );
  }
  const permissionFiles = await Promise.all(
    fileHandles.map((handle: any) =>
      handle.queryPermission({ mode: "readwrite" })
    )
  );
  for (let i = 0; i < permissionFiles.length; i++) {
    if (permissionFiles[i] == "granted")
      grantedFileHandles.push(fileHandles[i]);
  }

  // ディレクトリ
  if (directorys) {
    await Promise.all(
      directoryHandles.map((handle: any) =>
        handle.requestPermission({ mode: "readwrite" })
      )
    );
  }
  const permissionDirectorys = await Promise.all(
    directoryHandles.map((handle: any) =>
      handle.queryPermission({ mode: "readwrite" })
    )
  );
  for (let i = 0; i < permissionDirectorys.length; i++) {
    if (permissionDirectorys[i] == "granted")
      grantedDirectoryHandles.push(directoryHandles[i]);
  }

  return { grantedFileHandles, grantedDirectoryHandles };
};

const scanFiles = async (item: any, filesWithPath: any) => {
  if (item.isDirectory) {
    const directoryReader = item.createReader();
    for (;;) {
      const entries: any = await new Promise((resolve) =>
        directoryReader.readEntries((entries: any) => resolve(entries))
      );
      if (entries.length == 0) break;
      await Promise.all(
        entries.map((entry: any) => scanFiles(entry, filesWithPath))
      );
    }
  } else if (item.isFile) {
    const directory = item.fullPath.split("/").slice(1, -1).join("/");
    // const baseName = item.fullPath.split("/").slice(-1)[0].split(".")[0];
    // const extend = item.fullPath.split("/").slice(-1)[0].split(".")[1];
    if (filesWithPath[directory] == undefined) filesWithPath[directory] = [];
    const file: any = await new Promise((resolve) =>
      item.file((file: any) => resolve(file))
    );
    filesWithPath[directory].push(file);
  }
};

export const getFilesWithPath = async (items: any) => {
  const filesWithPath: any = {};
  const entries = Object.values(items).map((item: any) =>
    item.webkitGetAsEntry()
  );
  await Promise.all(
    entries.map((entry: any) => scanFiles(entry, filesWithPath))
  );
  return filesWithPath;
};

export const file2Image = async (file: any) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  await new Promise<void>((resolve) => (reader.onload = () => resolve()));
  const image: any = new Image();
  image.src = reader.result;
  await new Promise<void>((resolve) => (image.onload = () => resolve()));
  return image;
};

export const memory = () => {
  const used = process.memoryUsage();
  let ret = `rss: ${Math.round((used.rss / 1024 / 1024) * 100) / 100} MB`;
  ret += `, heapTotal: ${
    Math.round((used.heapTotal / 1024 / 1024) * 100) / 100
  } MB`;
  ret += `, heapUsed: ${
    Math.round((used.heapUsed / 1024 / 1024) * 100) / 100
  } MB`;
  ret += `, external: ${
    Math.round((used.external / 1024 / 1024) * 100) / 100
  } MB`;
  ret += `, arrayBuffers: ${
    Math.round((used.arrayBuffers / 1024 / 1024) * 100) / 100
  } MB`;
  return ret;
};

export const checkMemory = () => {
  if (global.gc) global.gc();
  else {
    console.log(
      "You have to run this program as `node --expose-gc --inspect=0.0.0.0:9229 index.js`"
    );
    process.exit();
  }
  const heapUsed = process.memoryUsage().heapUsed;
  console.log("heapSize: ", heapUsed);
};
