## はじめに

本ブログサイトは Vite、React、TypeScript、Tailwind CSS を用いて作成しています。また、データベース、ホスティングサービスには Firebase を採用しました。Markdown 形式のファイルを投稿することでブログが更新されます。React ベースで作成されているため、ページ遷移に読み込みが行われることはありません。

## 投稿機能

本サイトを見てもらえることからわかることですが、目次の作成、ページネーション、イメージの挿入などの基本的な機能は実装されています。このブログの特徴として少しでも早くなるようにマークダウンを投稿時点で HTML に変換しています。画像の保存には GitHub を利用しました。

新規作成画面
![新規作成画面](https://raw.githubusercontent.com/Laplade/public/main/storage/blog/QZ2EdZQWMRru2KaQt8x2/新規作成.png "新規作成画面")

編集画面
![編集画面](https://raw.githubusercontent.com/Laplade/public/main/storage/blog/QZ2EdZQWMRru2KaQt8x2/編集.png "編集画面")

以下は投稿時のコードの一部抜粋です。

```js
  const postOnClick = async () => {
    const markdown = textList[2].replaceAll("\n", "%n"); // Firebaseには「\n」を使用できない

    const html = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(customCode)
      .use(rehypeHighlight)
      .use(rehypeSlug)
      .use(rehypeStringify)
      .process(textList[2]);

    const tableOfContents = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use((options: any): any => {
        return (node: any) => {
          const result = toc(node, options);
          node.children = [result.map];
        };
      }, {})
      .use(remarkRehype)
      .use(rehypeStringify)
      .process(textList[2]);
    let thumbnail = textList[3];
    fileList.forEach((file: any, index: number) => {
      if (file.checked) {
        thumbnail = file.url;
        return;
      }
    });

    if (post) {
      // 編集
      await setDoc(
        doc(firebase.firestore, `users/${user!.uid}/posts/${post!.id}`),
        {
          title: textList[0],
          tags: textList[1].split(","),
          markdown,
          html: html.toString(),
          toc: tableOfContents.toString(),
          thumbnail,
          updated_at: serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      // 新規作成
      await addDoc(collection(firebase.firestore, `users/${user!.uid}/posts`), {
        title: textList[0],
        tags: textList[1].split(","),
        markdown,
        html: html.toString(),
        toc: tableOfContents.toString(),
        thumbnail,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    }
    navigate("/");
  };
```

## お問い合わせ機能

お問い合わせ機能ではメール送信を実装しています。その際に使用したのが Trigger Email from Firestore というものです。

![Trigger Email from Firestore](https://raw.githubusercontent.com/Laplade/public/main/storage/blog/QZ2EdZQWMRru2KaQt8x2/TriggerEmailFromFirestore.png "Trigger Email from Firestore")

## 参考サイト

参考にしたサイトは数え切れないので特に参考にしたサイトを掲載します。

[React Hooks と TypeScript でつくる Todo PWA ~ 入門 React ハンズオン](https://zenn.dev/sprout2000/books/76a279bb90c3f3)

[Next.js を利用した初めての本格的 Markdown ブログサイトの構築](https://reffect.co.jp/react/nextjs-markdown-blog)
