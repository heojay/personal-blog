---
title: SOPS를 써보고
date: 2021-01-17 00:00:00
category: dev
draft: false
---

여러분은 혹시 secret을 어떻게 관리하고 계신가요? 최근 저는 팀 내에서 DevOps 성격의 일을 주로 도맡아 진행하고 있었습니다. 오늘은 secret 관리에 관해 생긴 저의 고민, 이를 해결하기 위해 도입한 SOPS와 개인적으로 유용했던 팁에 대해 간단히 살펴보겠습니다.

## secret 관리에 대해

이 글에서 정의하는 secret은 데이터베이스나 API 등에 접근하기 위해 사용되며 비공개적인 성격을 가지고 있는 데이터, 토큰 따위를 말합니다. 인증에 사용되는 아이디와 비밀번호 조합, 쿠버네티스 Kubeconfig 등이 여기 포함됩니다. Private 저장소를 사용할 수 있는 상황이 아니라고 가정할 때, 이러한 데이터는 어떻게 관리를 해야할까요?

별 다른 암호화 없이 secret을 하드 코딩하는 것은 매우 위험한 일입니다. 권한이 있는 누구나 그 secret에 접근할 수 있고, 맘대로 사용할 수 있는 상황은 지양해야겠죠. (공개 Repo에 별다른 암호화 작업 없이 AWS secret Key를 업로드하면 생기는 일은 다음 [링크](https://news.hada.io/topic?id=3169&fbclid=IwAR2b3zsVdSUhIPyMWxacrVe0-XTj6jqjuTWkbOjr6dln1K1MT_j3cvsp47g)를 참고하세요!)

또 다른 아이디어는 코드와 분리해두는 일입니다. 이 경우에는 환경변수나 파일 시스템 어딘가에 secret이 존재한다는 가정하에 코드를 작성합니다. 아까보다는 분명 안전해졌지만 코드와 secret의 context가 분리된다는 단점이 생깁니다. 적당한 저장소를 찾지 못해서 메신저로 주고 받는 경우도 종종 있지만, 그렇게 되면 쉽게 바꾸지도 못하고, 팀원 각자 가진 secret의 consistency를 보장하기도 어려워집니다. secret을 관리할 별도의 저장소를 찾았다고 해도 관리 포인트가 늘어나는 것은 피할 수 없습니다.

이와 같은 secret 관리의 어려움을 해결하기 위한 다양한 툴들이 있지만 오늘은 그 중에서 제가 사용해 본 SOPS에 대해 공유해드리도록 하겠습니다.

## [SOPS](https://github.com/getsops/sops)

SOPS(Secrets OPerationS)는 Cloud Native Computing Foundation 샌드박스 프로젝트 중 하나로, yaml, json, env, ini, 그리고 그 외 여러 포맷들을 지원하는 암호화 파일 에디터입니다.

![](./images/sops-1.gif)

### 설치

https://github.com/getsops/sops/releases 에서 binary, package 파일을 다운 받거나, Mac이라면 `brew install sops` 로 간단하게 설치할 수 있습니다.

### 준비

SOPS는 AWS KMS, GCP KMS, Azure Key Vault 등 다양한 Key Management Service를 지원하지만, 저희 회사에서는 프라이빗 클라우드 플랫폼을 이용하고 있기 때문에 저는 [GPG](https://gnupg.org)를 이용해 만든 PGP를 key로 사용하였습니다. 이번 가이드에서도 GPG가 설치되어 있다고 가정합니다.

SOPS 저장소의 예제를 이용해보도록 하겠습니다. 저장소를 clone하고, 아래 커맨드로 gpg에 SOPS 테스트 키를 import 합시다. (실사용시에는 직접 만든 key를 사용해야 합니다.)

```
$ git clone https://github.com/getsops/sops.git
$ cd sops
$ gpg --import pgp/sops_functional_tests_key.asc
```

### 사용

이제 이 폴더에 있는 `example.txt`을 이용해 SOPS를 사용해보겠습니다. 우선 이 파일을 그냥 열게 되면 내용은 아래와 같이 SOPS로 암호화된 파일이 나옵니다. 자세히 읽어보면, data와 encryption information으로 이루어져 있는 것을 알 수 있습니다.

```
$ cat example.txt
{
	"data": "ENC[AES256_GCM,data:p6kOd9e7KOYw47VlNlKa52wPFfbY3xaJYQrO5QDT1LyNvUIVBSRTrJxvn5MCC7vdnTOkcBzWmlr6Z/Q23/sx22++3Y7nXTSgFPQxPVIA8X33OoIsCamNHS8+8JWOReALCf2Cd3rzedu0GWR+/f2YBSHNA3C4nffEDbWbXRyAvcvCv3G4umH+Jh9auWUlfbk3Bx/8LvX6DodcxhQ=,iv:ESrDyOG6qetEWGBNHWRpT6ra1NhpaFH3SnjBSdMj2r0=,tag:aP5vOboB64cJDUls9WKsTA==,type:str]",
	"sops": {
		"kms": null,
		"gcp_kms": null,
		"azure_kv": null,
		"lastmodified": "2019-12-10T22:44:49Z",
		"mac": "ENC[AES256_GCM,data:wN+npCzfJVz6nwZQ40FTPD23Ly1CEiU1N6aDua+Mgj9cH7NwJOklW8QKTs3+q3f4HEkbeuFE6VQN+Jm05Zsj1inGjAdG2MfDurspJl6Jpe5DBKgk3zudAcc66gm4T4Dn3h7zFvNovOl+VEa4+ntaxIoVNugVDq3ZLTj/wMd3XwU=,iv:RadNg2jPeQEkE1F/GzrdcPIZHbxXoZpo+iOHpRGlLhc=,tag:ID8N4xhN7p3N5EYGTkYKxg==,type:str]",
		"pgp": [
			{
				"created_at": "2019-12-10T22:44:49Z",
				"enc": "-----BEGIN PGP MESSAGE-----\n\nwcBMAyUpShfNkFB/AQgANOTnicDHAmqwi76yIm2eAgzm32k34hsPS40vKeCKtbIP\niR91/hDmklYXgR9yL9xgBI0SRTMGySSk9YJ9daZd61JVh1IVuxr93Y8GSxhDldAn\n1Wc2dXJ24x7zxfUs4sfZYCtzXZBUb/eAPLDIkeKPzkVKN4kLdVdccOig/2lOuuVo\nw3Xy+m7cx0VPdsFFzVWok15oHj8n0+J8v6Vnyiyx7yI7xgsynNwpZDUN+K15NyGs\nkaO21AeQnxDWmwo4H93+r10esFYns0kyLOCNwN5/XLskT31f9MCo8H4bBDyeO1lE\nrfLKAn0mh81qKedQLTssjElCLBgY4CpcL9B688P/otLgAeSR+v/JrgslAw+QhiBC\nPxqj4ZUC4KbgFeERieC34sjLWuPgxOUoC769iqiM3ArscWLYG6jYb9Acigwtf5/r\nNkFoXHoZPOD15Ne/ElmCDPowh0aAFCwVp6/ipRc0teELTQA=\n=FyYT\n-----END PGP MESSAGE-----",
				"fp": "FBC7B9E2A4F9289AC0C1D4843D16CEE4A27381B4"
			},
			{
....
```

그리고 이제 SOPS로 실행을 해보면 아래와 같은 편집기 화면으로 전환이 됩니다. 이 상태에서 바로 편집이 가능하고, 편집이 모두 끝나면 다시 새롭게 암호화된 상태로 저장이 됩니다.

```
$ sops example.txt
Welcome to SOPS!

SOPS is a manager of encrypted files designed to help distribute secrets.
Check it out, it's on github: https://github.com/mozilla/sops
```

이 파일을 그대로 복호화할 수 있습니다. `--in-place`는 현재 파일에 복호화된 값을 덮어씌워줍니다.

```
$ sops --decrypt --in-place example.txt
```

이를 다시 암호화 해보겠습니다. SOPS로 암호화를 하기 위해서는 추가로 config 파일을 만들거나, command line에 key option을 추가해야 합니다. 현재 있는 폴더에는 `.sops.yaml`이라는 config 파일이 있기 때문에, 별다른 설정 없이 암호화를 할 수 있습니다.

```
$ sops --encrypt example.txt
$ sops --pgp <PGP-FINGERPRINT> --encrypt example.txt // config가 없는 경우
```

### 개인적인 팁

- SOPS는 확장자에 맞게 암호화, 복호화됩니다. 예를 들어 yaml을 암호화하면 암호화된 yaml 구조의 파일이, json을 암호화하면 암호화된 json 구조의 파일이 나옵니다. SOPS 저장소의 example로 시작하는 파일들을 비교해보시면 한 번에 이해하실 수 있습니다.

  - 특히나 이러한 확장자들의 경우 key는 암호화되지 않아 어떤 key가 있는 지 암호화 된 상태에서도 확인할 수 있습니다.

- yaml 등 SOPS가 지원하는 확장자 이외의 포맷을 복호화하면 결과물이 json 구조로 나오는데, 결과물에 json 확장자를 붙이면 안됩니다. 현재 SOPS는 해독을 할 때 확장자를 이용해서 포맷을 유추하여, 같은 내용 다른 포맷으로 결과가 나오기 때문입니다.

  - 예를 들어, 위에서 사용한 `example.txt`의 확장자만 json으로 바꿔 복호화하면 아래와 같은 결과물이 나옵니다.

    ```
    $ sops -d example.txt.json
    {
    	"data": "Welcome to SOPS!\n\nSOPS is a manager of encrypted files designed to help distribute secrets.\nCheck it out, it's on github: https://github.com/mozilla/sops\n\n"
    }
    ```

  - 만약 다른 확장자로 인식시켜 입출력을 하고 싶다면 각각 `--input-value`, `--output-value` flag를 지정하면 됩니다.

  - 참고로 저희 팀은 암호화된 파일에는 확장자로 enc를 붙이고 있습니다.

- git을 이용할 때, SOPS로 암호화한 파일을 commit 할 경우 commit 간의 비교가 어렵다는 단점이 있습니다. 이 때, `.gitattributes`와 `.gitconfig`를 변경하면, `git diff` 커맨드를 사용할 때 복호화한 값으로 비교할 수 있습니다.

  ```
  # .gitattributes
  *.enc diff=sopsdiffer

  $ git config diff.sopsdiffer.textconv "sops -d"

  $ grep -A 1 sopsdiffer .git/config
  [diff "sopsdiffer"]
          textconv = "sops -d"
  ```

- yaml과 json의 경우, key suffix로 `_unencrypted`를 붙이거나, 아래와 같이 정규표현식을 사용하여 특정 key만 암호화 하는 것도 가능합니다.

  ```
  $ sops --encrypt --encrypted-regex '^(data|stringData)$' k8s-secrets.yaml
  ```

## 마치며

이것으로 첫 문단에서 언급했던 secret 관리의 악몽에서 깨어날 수 있게 됐습니다. 이제 secret 관리는 형상관리에 포함되며 그 이점을 모두 누릴 수 있습니다. 팀원들은 쉽고 안전하게 secret을 공유할 수 있고, 변경이력을 관리할 수 있습니다. (거의 변할 일 없는) 암호화에 이용할 Key만 서로 공유하면 됩니다.

그 외에 제가 생각하는 SOPS만의 장점은 다음과 같습니다.

1. 기본적으로 편집기라는 점 덕분에 암호화된 파일의 내용을 쉽게 수정할 수 있습니다.
2. 하나의 파일을 여러 개의 Key로 암호화, 복호화 할 수 있도록 설정할 수 있습니다. 이를 통해 파일 별 권한 관리(Auditing)도 가능하고, backup key를 설정하는 것도 가능합니다.
3. 이식성이 훌륭합니다. 바이너리 파일을 설치할 수 있거나, 도커 이미지를 사용할 수 있다면 어디서든 사용할 수 있습니다. 덕분에 저희도 CI/CD 파이프라인에서 SOPS를 사용하고 있습니다.

secret 관리에 어려움을 겪고 계셨던 분들이라면, 이번 기회에 꼭 SOPS를 활용해보시길 바랍니다.

## 그 외

- Helm에서 secret을 편하게 사용하기 위해 개발된 [helm-secrets](https://github.com/jkroepke/helm-secrets) 플러그인도 SOPS를 이용합니다.

- PGP Key에 Passphrase가 있으면 SOPS를 CI/CD 파이프라인에서 활용하기 무척 까다롭습니다. 하지만 GPG를 사용하면 일반적으로 Passphrase 설정이 강요되는데요, GPG를 이용할 때 아래 커맨드를 사용하면 Passphrase 없이 만들 수 있습니다.

  ```
  gpg --pinentry-mode-loopback --expert --full-gen-key --passphrase=''
  ```
