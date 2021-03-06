---
title: Helm Schema에 대해
date: 2021-03-01 00:00:00
category: dev
thumbnail: { thumbnailSrc }
draft: false
---

며칠 전 일이었습니다. 저희 팀은 이전에도 말했던 것처럼 off-the-shelf는 Helm으로 배포하고 있었습니다. 그런데 이번에 Helm과 함께 배포해야만 하는 resource가 생겼습니다. 일종의 extension이라고 생각하시면 좋을 것 같습니다. 이를 해결하기 위해 리드님께서 추가적인 Helm chart를 만드셨고, 값의 유효성을 검증하는 기능을 제게 맡기셨습니다. 저는 template을 아래와 같이 수정하고 기분 좋게 퇴근했습니다.

```yaml
# 지정한 namespace가 kube-system인 경우 fail하도록 함
{{ if (eq .Values.namespace "kube-system") }}
{{ fail "Invalid namespace" }}
{{ end }}
apiVersion: v1
kind: ConfigMap
...
```

그리고 다음 날 제 commit은 리드님의 피드백과 함께 역사속으로 사라지게 됩니다. 문제는 무엇이었을까요?

## [Schema Files](https://helm.sh/docs/topics/charts/#schema-files)

[Proposal: chart values schema](https://github.com/helm/helm/issues/2431)에서 Helm v3에 들어갈 기능으로 `values.schema`가 제안됩니다.

> The chart values are pretty free-form, which is nice as it presents a very low barrier to entry. However, it would be nice if chart authors had a means to validate the values against a schema. (...)

이러한 schema는 아래와 같은 형태로 작성됩니다. 여기에서 value의 자료형, 범위 등이 정의됩니다.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "properties": {
    "image": {
      "description": "Container Image",
      "properties": {
        "repo": {
          "type": "string"
        },
        "tag": {
          "type": "string"
        }
      },
      "type": "object"
    },
    "name": {
      "description": "Service name",
      "type": "string"
    },
    "port": {
      "description": "Port",
      "minimum": 0,
      "type": "integer"
    },
    "protocol": {
      "type": "string"
    }
  },
  "required": [
    "protocol",
    "port"
  ],
  "title": "Values",
  "type": "object"
}
```

그리고 이러한 schema는

- `helm install`
- `helm upgrade`
- `helm lint`
- `helm template`

와 같은 명령어를 사용할 때 자동으로 이용되며 유효성을 검증해줍니다.

### 장점

이렇게 schema를 활용하는 것이 template에서 직접 유효성을 검증하는 방법보다 더 좋은 이유는 다음과 같습니다.

1. 재사용성이 뛰어납니다. 일반적으로 Helm의 value는 여러 template에서 공유되는 값입니다. 만약 schema를 사용하지 않으면 모든 template에 검증 로직을 넣어야 하고, 수정할 때도 모든 template을 수정해야 할 것입니다.
2. context가 분리됩니다. template의 역할은 value를 받아 Kubernetes manifest를 생성하기 위한 틀입니다. template에서 유효성 검증하는 것은 역할을 넘어서는 일입니다. 각각의 단위는 자기가 맡은 부분에만 집중하는 것이 바람직합니다.
3. 가독성이 뛰어납니다. schema를 읽는 것과 template에 있는 모든 검증 로직을 읽는 것. 둘 중 어떤 것이 value에 들어갈 값을 짐작하기 쉬울까요? 조건문에 둘러싸인 value를 읽는 것보다 선언적 구조가 보다 명료하게 읽힐 가능성이 높습니다.

정리하면, 명령적으로 구현하는 것과 선언적으로 구현하는 것의 차이로도 볼 수 있겠습니다.

## 마치며

제가 생각하는 Kubernetes의 가장 큰 장점 중 하나는 바로 '선언적'이라는 것입니다. 창세기처럼 'Pod이 있을지어다'라고 선언하면 그 과정을 구구절절 설명할 필요 없이 Pod이 하나 생깁니다. Helm v3에서 schema가 생긴 이유도 이와 비슷할 것이라고 생각합니다. '필요한 value는 무엇이고, 그 type은 어떠하다'고 schema를 통해 선언하는 것으로 Helm은 value의 존재와 type을 보장합니다.

이번 작업에 앞서 저는 Helm에 schema라는 기능이 있는 지 알지 못하고 있었습니다. 하지만 만약 제가 'validation logic을 작성한다'는 작업의 의미에 대해 깊이 고민해봤더라면, 아마 제 스스로 schema에 대한 니즈가 생겼을 것이고 혹시 이런 기능이 있는 지 검색해보고 찾아 사용했을 것입니다. 관성에 매몰되어 일의 본질을 생각하지 못한 점이 이번 작업에서 가장 아쉽습니다. 다음부터는 같은 실수를 반복하지 않도록 신중하게 일의 의미를 생각해보고자 합니다.
