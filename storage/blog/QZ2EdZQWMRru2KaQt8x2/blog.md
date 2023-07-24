## はじめに

本ブログサイトは Vite、React、TypeScript、Tailwind CSS を用いて作成しています。また、データベース、ホスティングサービスには Firebase を採用しました。Markdown 形式のファイルを投稿することでブログが更新されます。React ベースで作成されているため、ページ遷移に読み込みが行われることはありません。また、Next を採用しなかったのはホスティング先が Vercel ほぼ 1 強になるからです。これからますますフロントエンドの状況は進化していくことが予想されます。その時に選択の範囲が狭まるのは好ましくないと考えたためです。

## 機能紹介

### 基本機能

本サイトを見てもらえばわかることですが、目次の作成、ページネーション、カテゴリー表示、イメージの挿入などの基本的な機能は実装されています。フッター部のソーシャルへのリンクは実装していません。見栄えが良いのでつけただけです(笑)。

### 投稿機能

このブログの特徴として少しでも表示が早くなるようにマークダウンの投稿時点で HTML に変換しています。画像の保管箇所には GitHub を利用しています。

**新規作成画面**
![新規作成画面](https://raw.githubusercontent.com/Laplade/public/main/storage/blog/QZ2EdZQWMRru2KaQt8x2/新規作成.png "新規作成画面")

**編集画面**
![編集画面](https://raw.githubusercontent.com/Laplade/public/main/storage/blog/QZ2EdZQWMRru2KaQt8x2/編集.png "編集画面")

以下は投稿時のコードの抜粋です。post した時に html へ変換や目次の作成をしているのがわかると思います。認証には Firebase の Authentication を利用しています。

```js
  const postOnClick = async () => {
    const markdown = textList[2].replaceAll("\n", "%n"); // Firebaseには「\n」を使用できない
    const html = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
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

### お問い合わせ機能

お問い合わせではメール送信を実装しています。その際に使用したのが Trigger Email from Firestore というものです。

![Trigger Email from Firestore](https://raw.githubusercontent.com/Laplade/public/main/storage/blog/QZ2EdZQWMRru2KaQt8x2/TriggerEmailFromFirestore.png "Trigger Email from Firestore")

この拡張機能を使うと Firestore に登録するだけでメールを送信することができます。
以下は送信ボタン押下時のコードの抜粋です。

```js
const sendOnClick = async () => {
  const mailData = {
    to: "xxx@yyyy.zzz",
    message: {
      subject: "ブログへのお問い合わせ",
      text: `name:${textList[0]}\nmail:${textList[1]}\ntitle:${textList[2]}\nmessage:${textList[3]}`,
    },
  };
  await addDoc(collection(firebase.firestore, `mail`), mailData);
  navigate(`/contact`, { state: { sent: true } });
};
```

## おわりに

トップページにカテゴリーの表示や SNS へのリンクなど、まだまだ直したい箇所が多いですが、とりあえず形になりましたので公開します。これからフロントエンドや組み込み系を中心に更新していこうと思います！

## 参考サイト

参考にしたサイトは数え切れません。特に重要なサイトを以下に掲載します。

[React Hooks と TypeScript でつくる Todo PWA ~ 入門 React ハンズオン](https://zenn.dev/sprout2000/books/76a279bb90c3f3)

[Next.js を利用した初めての本格的 Markdown ブログサイトの構築](https://reffect.co.jp/react/nextjs-markdown-blog)
