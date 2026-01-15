<template>
  <div class="p-40 max-sm:p-10">
    <n-card title="连接">
      <template #header-extra>{{ uuid }}</template>
      将登录 {{ client_name }}
      <template #footer v-if="!storeSign.is_sign">
        <n-button text>正在跳转登录页</n-button>
      </template>
      <template #action v-if="storeSign.is_sign">
        <div class="flex mt-5 justify-center" v-if="loading">
          <n-spin size="large">
            <template #description>验证中</template>
          </n-spin>
        </div>
        <div v-else>
          <n-button v-if="redirect_uri" type="primary" tag="a" :href="redirect_uri"> 同意 </n-button>
          <n-button
            style="margin-left: 10px"
            type="error"
            @click="
              router.push({
                name: ROUTE_NAME_HOME,
              })
            "
          >
            拒绝
          </n-button>
        </div>
      </template>
    </n-card>
  </div>
</template>
<script setup lang="ts">
  import instance from '@/utils/ky'
  import { ref } from 'vue'
  import { nMessage } from '@/utils/naive'
  import { useRouter, useRoute } from 'vue-router'
  const route = useRoute(),
    router = useRouter()

  import signStore from '@/stores/sign.ts'
  import { ROUTE_NAME_HOME } from '@/router'
  const storeSign = signStore()

  const uuid = route.params.uuid

  const client_name = ref(),
    redirect_uri = ref(),
    loading = ref(true)

  if (storeSign.is_sign) {
    instance
      .post('/api/link', {
        json: {
          uuid,
        },
      })
      .then(async (res) => {
        client_name.value = route.query?.name

        let data = await res.json()
        redirect_uri.value = `${route.query.url}?user_id=${data.user_id}&username=${data.username}&avatar=${data.avatar}&token=${storeSign.user_token}`
        loading.value = false
      })
      .finally(() => {
        loading.value = false
      })
  } else {
    nMessage().error('请登录后再访问')
    storeSign.signIn()
  }
</script>
<style scoped lang="stylus"></style>
