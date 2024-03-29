---
title: Helmfile을 써보고
date: 2021-01-04 00:00:00
category: dev
draft: false
---

최근 Helm을 좀 더 편하게 사용할 방법이 없을까? 하는 고민에서 시작해 사용하게 된 Helmfile에 관해 이야기해 보고, 사용 후 느낀 점에 대해 이야기해 보겠습니다.

## 들어가며

저희 팀의 개발 환경 세팅은 다음과 같습니다.

- 모든 팀원이 개인 Kubernetes 클러스터를 가지고 있습니다. 실제 Production 환경과 유사한 클러스터를 각자 가지고 그 위에서 개발하는 방식입니다.
- 저희는 직접 만들지 않은 Fluentbit, Prometheus와 같은 [off-the-shelf](https://www.quora.com/What-is-the-meaning-of-off-the-shelf-software) resource를 최대한 Helm 차트로 관리하고 있습니다. 이는 resource 정의를 직접 관리하지 않아도 되고, 업스트림 반영이 쉽다는 장점이 있습니다.
- 초기 개발 환경 설정은 메뉴얼한 작업이었습니다. 이를테면 Helm `values.yaml` 등 설치 관련 파일에 필요한 설정을 손으로 추가하고 명령어를 입력하는 방식입니다. 이러한 설치 방법이 적힌 마크다운을 잘 따라 하면 환경이 설정됩니다.

짐작하시겠지만 사실 새로 클러스터를 만들고 메뉴얼을 따라하는 방법은 다소 비효율적이었습니다. 이 과정을 한 번 실행하면 누구나 동일한 개발 환경이 만들어지는 스크립트 형태로 바꾸면 어떨까 하는 고민을 시작하게 됐습니다.

## Helm

Kubernetes를 어느 정도 쓰기 시작했다면, 사용해 본 적은 없더라도 한 번쯤 [Helm](https://Helm.sh)에 대해서 들어보셨거나 사용한 경험이 있으실 것 같습니다. Helm이란 Chart라는 미리 설정된 Kubernetes resource 패키지를 관리하기 위한 도구입니다. 그 장점 덕분에 많은 분들이 사용하고 계시고, 저희 팀 역시 사용하고 있습니다. Helm에 대한 이야기는 인터넷 상에 더 좋은 글들이 많기 때문에 이 글에서 따로 다루지는 않겠습니다.

제가 Helm을 사용하면서 생각했던 개인적인 아쉬운 점은 다음과 같았습니다.

- 한 번에 여러 Chart를 동시에 배포하기 어렵습니다. 특히 배포해야 하는 환경이 많고, 각 환경마다 배포 설정이 다르다면 더욱 까다로워집니다.
- 리소스를 한 번에 관리하기 위해 Helm을 사용했지만, 정작 이렇게 배포된 Helm releases를 관리하기 어렵다는 문제도 있습니다. Helm 배포 목록을 확인하려면 `helm list` 를 입력해 현재 클러스터에 깔려 있는 Helm chart를 확인하거나, 이를 어딘가에 기록해둬야 합니다. 코드로 관리하기 위해서는 다른 방법이 필요합니다.

처음에는 그냥 bash로 작성하려고 했지만 분명 비슷한 고민을 하고 있는 사람들이 있을 것이라는 생각에 검색을 하던 중, Helmfile을 만나게 됩니다.

## [Helmfile](https://github.com/helmfile/helmfile)

Helmfile은 (설명에 따르면) Helm을 배포하기 위한 선언적 Spec입니다. 마치 우리가 Kubernetes Spec을 작성해서 resource를 정의하는 것처럼, Helmfile을 작성해서 Helm 배포를 정의한다고 생각하시면 됩니다. 어떤 게시물에는 "Helmfile은 Helm을 위한 Helm이다" 라는 표현이 있었는데 곱씹을수록 그럴싸한 표현 같습니다.

### 설치

설치 방법은 간단합니다. [Installation](https://github.com/helmfile/helmfile#installation) 에서 binary, package 파일을 다운 받거나, Mac이라면 `brew install helmfile` 로 간단하게 설치할 수 있습니다. 다만, 당연히 Helm이 설치되어 있어야 하고, 차트 비교를 위해 [helm-diff plugin](https://github.com/databus23/helm-diff)이 기본적으로 필요합니다. 이 외에도 저는 [helm-secrets plugin](https://github.com/jkroepke/helm-secrets)도 설치해서 사용했고, 여타 많은 plugin들을 Helmfile과 함께 이용할 수 있으니 참고하시기 바랍니다.

### 사용

사용 방법 역시 간단합니다. [Configuration](https://helmfile.readthedocs.io/en/latest/#configuration) 에 나와있는 것처럼 `helmfile.yaml`을 작성하고, 이 파일이 있는 디렉토에서 `helmfile apply` 를 입력하면 파일에 정의된 그대로 Helm이 배포됩니다. 예를 들어 아래와 같은 파일이 있다면, 간단하게 Prometheus를 클러스터에 배포할 수 있게 됩니다. 학습 난이도가 낮다는 점도 Helmfile의 매력이라고 생각합니다.

```
# helmfile.yaml
releases:
- name: prom-norbac-ubuntu
  namespace: prometheus
  chart: stable/prometheus
```

이 문서에서는 Configuration을 하나하나 뜯어보며 어떻게 사용하는 지를 설명하는 대신 유용하다고 생각했던 부분만 몇 가지만 소개하도록 하겠습니다.

#### Repository

`helm add repo` 를 담당하는 부분으로, 배포하기 전에 차트가 포함된 저장소를 추가하고 업데이트 할 수 있습니다.

```
repositories:
- name: stable
  url: https://charts.helm.sh/stable
- name: incubator
  url: https://charts.helm.sh/incubator
```

#### Environments

환경마다 다른 `values.yaml`를 배포하는 방법은 2가지가 있습니다. 아래와 같은 `helmfile.yaml`이 있다고 가정합니다.

```
environments:
  prod:
    values:
    - ./env/prod/values.yaml # 1.환경 변수
  stg:
    values:
    - ./env/stg/values.yaml

releases:
- name: kubernetes-dashboard
  namespace: kube-system
  chart: stable/kubernetes-dashboard
  version: 0.10.0
  values:
  - "./config/kubernetes-dashboard/values.yaml.gotmpl"
  - "./config/kubernetes-dashboard/{{ .Environment.Name }}.yaml" # 2.경로 지정
```

첫째는 환경 변수를 이용하는 방법입니다. `environments` 아래 있는 values.yaml은 환경 변수로 사용되어, release 안의 `gotmpl` 안에 사용됩니다. 예를 들어 위의 파일 내용이 아래와 같다고 해보겠습니다.

```
# ./config/kubernetes-dashboard/values.yaml.gotmpl
replicas: {{ .Values | get "dashboard.replicas" 1 }}
```

```
# ./env/prod/values.yaml
dashboard:
  replicas: 3
```

Helmfile은 prod 환경을 배포할 때 이 둘을 합쳐서 template에 3을 채워 넣게 됩니다. Helm에서 Chart를 채워 넣는 것과 같습니다. 이 때 주의할 점은 `./env/prod/values.yaml` 의 값은 환경 변수이기 때문에 모든 releases에서 공유한다는 것 입니다. 템플릿을 사용하는 방법은 이 외에도 정말 다양하니 직접 문서를 읽고 본인의 입맛에 맞게 잘 바꿔 사용하시기 바랍니다.

둘째는 경로 지정입니다. 마지막 줄의 `{{ .Environment.Name }}` 자리에는 배포 환경 이름이 들어가게 됩니다. 예를 들어 `helmfile -e prod apply` 라는 명령어를 입력하게 되면, 마지막 줄은 `./config/kubernetes-dashboard/prod.yaml`이 될 것입니다. 따라서 공통 설정을 담은 `values.yaml`을 하나 만들고, 환경에 맞게 파일을 추가로 하나씩 만드는 것도 가능할 것입니다.

다만 이미 템플릿인 Helm에 다시 템플릿을 이용하는 꼴이기 때문에, 관리 복잡도가 높아질 수도 있습니다.

#### Optional Deploy

때에 따라서는 모든 환경에 배포할 필요가 없는 resource 들도 있습니다. 이는 `releases.condition`를 활용하는 것으로 해결할 수 있습니다. 이를 포함해 if, else, then과 같은 조건문을 배포 전략에 반영할 수 있습니다.

```
environments:
  prod:
    values:
    - vault:
        enabled: false # prod에서 vault는 배포되지 않습니다.

releases:
  - name: vault
    chart: roboll/vault-secret-manager
    condition: vault.enabled
```

#### Deploy Order

의존 관계에 따라서는 배포의 순서가 중요하기도 합니다. 예를 들어 특정 서비스를 배포하는 시점부터 로그가 보고 싶은데, log를 담당하는 fluent가 먼저 배포가 되어있지 않다면 난감합니다. Helmfile에서는 `releases.needs`라는 설정을 통해 이를 지원하고 있습니다.

```
releases:
- name: somerelease
  needs:
  - anotherelease
```

> 이와 별개로 "배포의 순서를 고민하는 것은 Kubernetes native한 접근인가?" 라는 생각을 하신다면 문서 하단 그 외를 참고해주세요.

## 마치며

이렇게 쓰고 난 감상을 한 줄로 적으면 다음과 같습니다.

> 편한 부분이 많지만, 전체를 대체하기는 어렵다.

이렇게 생각한 이유는 간단한데 결국 배포하고자 하는 모든 resource가 Helm으로 되어있지 않기 때문에, 처음에 목표로 했던 turn-key 형태를 만들기 위해서는 Helmfile과 여타 resource를 동시에 배포하기 위한 별도의 script를 만들어야 했습니다.

만약 정말 Helmfile만 써서 이 문제를 해결해야하는 상황이 온다면, Helm 외적인 resource들을 Helm chart로 변환하는 것도 하나의 방법이겠습니다. 실제로 Helmfile에서도 문서에서 [Helmify-kustomize](https://gist.github.com/mumoshu/f9d0bd98e0eb77f636f79fc2fb130690) 라는 방식을 이용해 kustomize를 Helm template으로 바꿔주는 방법을 제안하기도 합니다. 관리의 부담도 있지만, 비유를 들자면 모든 문서를 하나의 언어로 통일하기 위해 번역기를 돌리는 것과 같다고 느껴져 이 방법은 사용하지 않기로 했습니다.

그럼에도 Helm을 코드 형태의 선언적인 구조로 쉽고 간단하게 관리할 수 있다는 점은 Helmfile의 분명한 매력이라고 생각합니다. Container 이미지로도 Helmfile을 이용할 수 있으니 CI/CD 파이프라인에서 활용할 수도 있고, script를 사용하는 것보다 추상화되어 있어 훨씬 간편하게 Helm을 사용할 수 있게 된 것 같습니다. 어느 쪽이든, 마크다운 형태의 배포를 청산할 수 있어서 다행이었습니다.

## 그 외

- [Helmsman](https://github.com/Praqma/Helmsman) 라는 프로젝트도 있습니다. 저는 Helmfile의 사용 방법이 좀 더 직관적이었기 때문에 이 쪽을 사용했으나, 두 프로젝트의 목적도 비슷하고 기능도 큰 차이가 없어 우열을 가리기 힘들다고 생각합니다. 이처럼 Helm의 코드 형태 관리 방식에 관심 있으신 분께서는 이 쪽도 참고하시면 좋겠습니다.
- 근본적으로 Helm이 과연 정답인가? 라는 생각을 하던 중에, [페이스북 Kubernetes Korea Group의 한우형님께서 쓰신 글](https://www.facebook.com/groups/k8skr/permalink/2651428451805478/)과 어형부형님의 코멘트가 도움이 되었습니다. 같은 고민을 하고 계시다면 한 번 읽어보시기 바랍니다.
