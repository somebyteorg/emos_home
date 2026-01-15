<template></template>
<script setup lang="ts">
  import { nMessage } from '@/utils/naive'
  import signStore from '@/stores/sign.ts'
  import { useRouter, useRoute } from 'vue-router'
  const storeSign = signStore(),
    route = useRoute(),
    router = useRouter()

  import { ROUTE_NAME_INDEX, ROUTE_NAME_HOME } from '@/router'

  let token = route.query?.token

  if (token) {
    nMessage().success('登录成功')
    storeSign.tokenSet(token)
    router.replace({
      name: ROUTE_NAME_HOME,
    })
  } else {
    nMessage().error('登录失败')
    router.replace({
      name: ROUTE_NAME_INDEX,
    })
  }
</script>
<style scoped lang="stylus"></style>
