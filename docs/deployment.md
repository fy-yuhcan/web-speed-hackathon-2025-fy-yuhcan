## アプリケーションのデプロイ方法

提出用環境の作成は、以下のいずれかの手順でローカルのアプリケーションをデプロイすることで行えます。
なお、スコア計測中にデプロイを行うと正しく採点されないことがありますので、注意してください。

### Heroku

> [!WARNING]
>
> **発生した費用は自己負担となります**

1. このレポジトリを自分のレポジトリに fork します
   - https://docs.github.com/ja/github/getting-started-with-github/fork-a-repo
2. Heroku のアカウントを持っていない場合、作成します
3. 自分のレポジトリを Heroku に連携させ、デプロイを設定します
   - https://devcenter.heroku.com/ja/articles/github-integration

### Railway

> [!WARNING]
>
> **発生した費用は自己負担となります**

1. Railway で `New Project` から GitHub リポジトリを選択します
2. `Settings > Root Directory` は **`.`（リポジトリルート）** のままにします
3. `Deploy` のコマンドを次のように設定します
   - Build Command: `pnpm run build`
   - Start Command: `pnpm run start`
4. Public Networking を有効にして URL を発行します

補足:

- `workspaces/server/database.sqlite` を使う構成のため、最初のデプロイ時点では別DBを用意しなくても動作します
- 採点用途ではスリープを避け、複数レプリカにはしない構成を推奨します

### Heroku 以外へのデプロイ

> [!WARNING]
>
> **発生した費用は自己負担となります**

レギュレーションを満たし、採点が可能であれば Heroku 以外へデプロイしても構いません。
