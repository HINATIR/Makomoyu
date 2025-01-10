# マコモ湯
マコモ湯はNintendo Switchのチートコード作成をアシストするアセンブラ,ディスアセンブラです。

# コマンド一覧
## /assemble offset sourcecode
以下の例では、0x0を開始アドレスとしてW0に1を入れる文をアセンブルし、Edizonで使用できるチートコードの形にします。  
  
offset : `0x0`  
sourcecode:  
```assembly
MOV W0, #1
RET
```
結果として、`08000000 00000000 D65F03C0 52800020`が出力されます。

> [!TIP]
> ブランチやジャンプの際の分岐先指定は、独自のラベル記法を用いることで簡素化できます。
> 詳しい記述方法は本マークダウンの最後に記載しています。

## /ips_assemble offset sourcecode
以下の例では、0x0を開始アドレスとしてW0に1を入れる文をアセンブルし、ipspatchとして使用できるチートコードの形にします。  
  
offset : `0x0`  
sourcecode:  
```assembly
MOV W0, #1
RET
```
結果として、`00000000 20008052C0035FD6`が出力されます。

> [!TIP]
> このコマンドでも`/assemble`同様に、ブランチやジャンプの際の分岐先指定は独自のラベル記法を用いることで簡素化できます。

## /disassemble cheatcode
以下の例では、チートコードから命令を排出し、ディスアセンブルしたものを開始アドレスとともに出力します。    
cheatcode:`08000000 00000000 D65F03C0 52800020`  
出力:  
```assembly
0x0:
MOVZ W0, #0x1
RET
```
> [!CAUTION]
> 入力されるチートコードのアドレスはすべて連続であることが前提です。
> 複数の開始アドレスを混在させることや、部分部分命令が抜けているようなチートコードは正常に解釈しません。

## /input_label offset source
以下の例では、0x4から0xCへのジャンプをラベルにて簡素化したものを本来のアセンブラ文に戻しています。  
offset : `0x0`  
sourcecode:  
```assembly
CMP W8, #0
B.NE _SKIP
MOV W0, #1
RET <= _SKIP
```
出力:  
```assembly
0x0:
CMP W8, #0
B.NE #0xC
MOV W0, #1
RET
```
## /how_to_label
ラベルの記述方法の説明です。  

元来の分岐記述方法
```assembly
0x0:
    CMP X0, X1
    B.LE #0xC
    LDR X0, [X8,#0x810]
    RET
```

ラベルを用いた記述
```assembly
0x0:
    CMP X0, X1
    B.LE _SKIP
    LDR X0, [X8,#0x810]
    RET <= _SKIP
```
### 記述ルール:
ラベル名はジャンプ先を記述する場所のそのまま書く。ただし、少なくとも他のアセンブラ命令に含まれる文字列が含まれてはいけないため、`_`等を用いることを推奨する。  
分岐先は`<= ラベル名`で指定する。  
> [!CAUTION]
> 分岐元は複数存在して構いませんが、分岐先が複数見られる場合はエラーとなります。
  
> [!CAUTION]
> `_SKIP`と`_SKIP2`のように、どちらかのラベル名にもう片方のラベル名が含まれているような命名の場合、正常に解釈しません。

# Credit
### cstool.exe [CapstoneEngine](https://www.capstone-engine.org/)
### kstool.exe [KeyStoneEngine](https://www.keystone-engine.org/)
### Coding [ChatGPT](https://chatgpt.com/)
