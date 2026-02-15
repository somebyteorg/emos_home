<template>
  <div class="p-40 max-sm:p-10">
    <n-card :title="`${data.pay_status == 'success' ? '已' : ''}支付给 ${data.service_name || ''}`">
      <template #header-extra>{{ no }}</template>
      <div v-if="!loading">
        <p>商品名称: {{ data.order_name }}</p>
        <p>
          所需萝卜: <code>{{ data.price_order }}</code>
        </p>
        <p>
          可用萝卜: <code>{{ data.carrot }}</code>
        </p>
      </div>
      <template #action>
        <div class="flex mt-5 justify-center" v-if="loading">
          <n-spin size="large">
            <template #description>验证中</template>
          </n-spin>
        </div>
        <div v-else>
          <template v-if="data.pay_status == 'default'">
            <n-button type="primary" @click="payment" :disabled="!data.is_can_pay" :loading="payment_loading"> 支付</n-button>
            <n-button style="margin-left: 10px" type="error" @click="toHome"> 拒绝 </n-button>
          </template>
          <template v-if="data.pay_status == 'success'">
            <n-button type="primary" tag="a" :href="to_url">点击跳转</n-button>
          </template>
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

  import { ROUTE_NAME_HOME } from '@/router'

  const no = route.params.no,
    return_url = route.query.return_url

  const loading = ref(true)

  const data = ref({}),
    to_url = ref('/')

  let toHome = () =>
    router.push({
      name: ROUTE_NAME_HOME,
    })

  let getInfo = () => {
    instance
      .get('/api/pay/info', {
        searchParams: {
          no,
        },
      })
      .then(async (res) => {
        data.value = await res.json()
      })
      .finally(() => {
        loading.value = false
      })
  }

  getInfo()

  let payment_loading = ref(false),
    payment = () => {
      payment_loading.value = true
      instance
        .post('/api/pay/payment', {
          json: {
            no,
          },
        })
        .then(() => {
          nMessage().success('支付成功')
          data.value.pay_status = 'success'
          if (return_url) {
            to_url.value = `${return_url}?no=${no}`
            setTimeout(() => {
              window.location.href = to_url.value
            }, 1000)
          } else {
            toHome()
          }
        })
        .finally(() => {
          payment_loading.value = false
        })
    }
</script>
<style scoped lang="stylus"></style>
