import { useState, ChangeEvent } from "react";

export default () => {
  const [textList, setTextList] = useState<string[]>([""]);

  const divideCommaString = (comma: string) => {
    let ret: string[] = [];
    let brackets = 0;
    let start = 0;
    let index;
    for (index = 0; index < comma.length; index++) {
      if (comma[index] == "(") brackets++;
      else if (comma[index] == ")") {
        brackets--;
        if (brackets < 0) break;
      } else if (!brackets && comma[index] == ",") {
        ret.push(comma.slice(start, index));
        start = index + 1;
      }
    }
    ret.push(comma.slice(start, index));
    if (brackets < 0) ret.push(comma.slice(index + 1));
    return ret;
  };

  const parseCell = (cell: any): any => {
    let rowIndex = 0;
    let columnIndex = 0;
    let index;
    for (index = 0; index < cell.length; index++) {
      if (cell[index] == "$") {
      } else if (cell[index] == ".") {
      } else if (cell[index] == '"') {
      } else if ("A" <= cell[index] && cell[index] <= "Z") {
        // A~Z
        columnIndex = index;
      } else if ("0" <= cell[index] && cell[index] <= "9") {
        // 0~9
        rowIndex = index;
      } else {
        break;
      }
    }
    return {
      address: cell.slice(0, rowIndex + 1),
      length: index,
      row: cell.slice(columnIndex + 1, rowIndex + 1),
      column: cell.slice(0, columnIndex + 1),
      rest: cell.slice(rowIndex + 1),
    };
  };

  const parseRange = (datatable: any, range: any): any => {
    let ret: string[] = [];
    const start = parseCell(range);
    if (range[start.length] == "(") {
      // 関数
      const comma = divideCommaString(range.slice(start.length + 1));
      let cLang = `${range.slice(0, start.length + 1)}`;
      for (let index = 0; index < comma.length - 1; index++) {
        if (index) cLang += `, ${comma[index]}`;
        else cLang += `${comma[index]}`;
      }
      cLang += `)`;
      ret.push(cLang);
    } else if (range[start.length] == ":") {
      const end = parseCell(range.slice([start.length + 1]));
      let flg = false;
      for (let key in datatable) {
        if (key == start.address) {
          ret.push(key);
          flg = true;
        } else if (flg) {
          ret.push(key);
          if (key == end.address) break;
        }
      }
    } else if (start.length) {
      // アドレス
      ret.push(start.address.replaceAll("$", ""));
    }
    return ret;
  };

  const func2c = (datatable: any, func: any, pre = "") => {
    let cLang = "";
    const cell = parseCell(func);
    if (func[cell.length] == "(") {
      // 関数
      const subFunc = func.slice(0, cell.length);
      if (subFunc == "") {
        const comma = divideCommaString(func.slice(1));
        if (comma[1]) {
          cLang = func2c(
            datatable,
            comma[1],
            `(${func2c(datatable, comma[0])})`
          );
        } else cLang = `(${func2c(datatable, comma[0])})`;
      } else if (subFunc == "IF") {
        const comma = divideCommaString(func.slice(cell.length + 1));
        cLang = `(${func2c(datatable, comma[0])})? ${func2c(
          datatable,
          comma[1]
        )} : ${func2c(datatable, comma[2])}`;
      } else if (subFunc == "SUM") {
        const comma = divideCommaString(func.slice(cell.length + 1));
        for (let index = 0; index < comma.length - 1; index++) {
          const range = parseRange(datatable, comma[index]);
          range.forEach((key: string) => {
            if (cLang) {
              if (key in datatable) cLang += ` + ${datatable[key].name}`;
              else cLang += ` + ${key}`;
            } else {
              if (key in datatable) cLang = `(${datatable[key].name}`;
              else cLang = cLang = `SUM(${key}`;
            }
          });
        }
        cLang += ")";
        if (comma[comma.length - 1])
          cLang = func2c(datatable, comma[1], `${cLang}`);
      } else if (subFunc == "LOG") {
        const comma = divideCommaString(func.slice(cell.length + 1));
        if (comma[1]) {
          cLang = func2c(
            datatable,
            comma[1],
            `log10(${func2c(datatable, comma[0])})`
          );
        } else cLang = `log10(${func2c(datatable, comma[0])})`;
      } else {
        // その他関数
        const comma = divideCommaString(func.slice(cell.length + 1));
        cLang = `${func.slice(0, cell.length + 1)}`;
        for (let index = 0; index < comma.length - 1; index++) {
          if (index) cLang += `, ${comma[index]}`;
          else cLang += `${comma[index]}`;
        }
        cLang += `)${func2c(datatable, comma[comma.length - 1])}`;
      }
    } else if (cell.length) {
      // アドレス or 数値 or 文字列
      const address = cell.address.replaceAll("$", "");
      if (address in datatable) {
        if (cell.rest)
          cLang = func2c(
            datatable,
            func.slice(cell.length),
            datatable[address].name
          );
        else cLang = `${datatable[address].name}`;
      } else if (func == '""') {
        cLang = "empty";
      } else {
        if (cell.rest)
          cLang = func2c(datatable, func.slice(cell.length), cell.address);
        else cLang = cell.address;
      }
    } else {
      // 演算
      if (
        func[0] == "+" ||
        func[0] == "-" ||
        func[0] == "*" ||
        func[0] == "/" ||
        func[0] == "<" ||
        func[0] == ">"
      )
        cLang = `${pre} ${func[0]} ${func2c(datatable, func.slice(1))}`;
      else if (func[0] == "^") {
        const cell = parseCell(func.slice(1));
        if (cell.rest)
          cLang = `pow(${pre}, ${cell.address})${func2c(datatable, cell.rest)}`;
        else cLang = `pow(${pre}, ${cell.address})`;
      } else if (func[0] == "=")
        cLang = `${pre} == ${func2c(datatable, func.slice(1))}`;
    }
    return cLang;
  };

  const onDropTsvFile = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const reader = new FileReader();
    reader.readAsText(e.dataTransfer.files[0], "shift-jis");
    await new Promise<void>((resolve) => (reader.onload = () => resolve()));

    const rows = String(reader.result).split("\r\n");
    const columns = rows[0]
      .split("\t")
      .map((func: string) => func.slice(1, -1));
    const names = rows[1].split("\t").map((func: string) => func.slice(1, -1));
    const funcs = rows[2].split("\t").map((func: string) => func.slice(1, -1));
    const row = funcs[0];
    const datatable: any = {};
    columns.forEach((label: string, index: number) => {
      if (index)
        datatable[label + row] = { name: names[index], func: funcs[index] };
    });
    let cLangs: string[] = [];
    Object.keys(datatable).forEach((key: string, index: number) => {
      const value = datatable[key];
      if (value.func.startsWith("=")) {
        cLangs.push(
          `float ${value.name} = ${func2c(datatable, value.func.slice(1))};`
        );
      } else {
        cLangs.push(`float ${value.name} = ${value.func};`);
      }
    });
    setTextList([cLangs.join("\n")]);
  };

  const textOnChange = (e: ChangeEvent<HTMLTextAreaElement>, index: number) => {
    setTextList(
      textList.map((text, idx) => {
        if (index == idx) return e.target.value;
        else return text;
      })
    );
  };

  return (
    <div>
      <div className="grid grid-cols-12">
        <div
          className="border border-gray-400 rounded-2xl p-5 m-5 col-span-3"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDropTsvFile}
        >
          <div>ここにTSVファイルをドラッグ＆ドロップ</div>
        </div>
        <textarea
          className="m-5 textarea textarea-bordered col-span-9"
          rows={10}
          placeholder="C言語"
          onChange={(e) => textOnChange(e, 0)}
          value={textList[0]}
        ></textarea>
      </div>
    </div>
  );
};
