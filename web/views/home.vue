<template>
  <div class="home p-40 max-sm:p-4 max-sm:mt-20 min-xl:w-5xl mx-auto">
    <n-card>
      <template #header>
        <p @click="showUserBase">{{ data.user_roles_string || '欢迎' }}</p>
      </template>
      <template #header-extra>
        <div class="flex">
          <n-button
            type="warning"
            text
            @click="
              () => {
                nMessage().success('退出成功')
                storeSign.signOut()
              }
            "
          >
            退出登录
          </n-button>
          <n-button
            style="margin-left: 10px"
            type="primary"
            text
            @click="
              () => {
                router.push({
                  name: ROUTE_NAME_INDEX,
                })
              }
            "
          >
            回主页
          </n-button>
        </div>
      </template>
      <n-list>
        <template #header>
          <p>欢迎来到 emos，本服完全免费，欢迎体验。</p>
          <p>感谢 Zn存档服、yzhazha、jack_cco、Love_benghuai3、ForAllDreams、miaojun 等大力支持。</p>
        </template>
        <template #footer>
          <n-skeleton v-if="loading" text :repeat="3" />
          <div v-else>
            <template v-if="data.is_viewing">
              <p>
                地址:
                <code @click="copyEmyaUrl">{{ data.emya_url }}</code>
              </p>
              <p>
                端口:
                <code>443</code>
              </p>
              <p>
                账号: <code>{{ data.username }}</code>
              </p>
              <p>
                <n-tooltip trigger="hover">
                  <template #trigger> 密码: </template>
                  安全期间 均为临时密码
                </n-tooltip>
                <template v-if="data.must_otp">
                  <n-button quaternary size="small" type="info" @click="emyaGetLoginPassword" :loading="emya_login_password_loading"> 点击获取 </n-button>
                </template>
                <template v-else>
                  <n-popconfirm negative-text="不要" positive-text="要" @positiveClick="emyaResetPassword()">
                    <template #trigger>
                      {{ data.emya_password || '点击设置密码' }}
                    </template>
                    设一个新的固定密码
                  </n-popconfirm>
                </template>
              </p>
            </template>
            <template v-else>
              愿您可以根据
              <n-button text tag="a" href="https://zh.wikipedia.org/zh-hans/%E5%85%AD%E5%BA%A6%E5%88%86%E9%9A%94%E7%90%86%E8%AE%BA" target="_blank"> 六度空间理论，</n-button>
              找到可以
              <n-button text tag="a" :href="data.telegram_group_url" target="_blank">发邀的伙伴，</n-button>
              让他带您
              <n-button text @click="showUserBase"> 一起玩耍。</n-button>
            </template>
          </div>
        </template>
      </n-list>
      <template #footer>
        <n-list>
          <n-list-item v-if="data.telegram_bind_url">
            <n-thing title="Telegram" description="建议绑上这个江湖人称纸飞机的家伙">
              <template #header-extra>
                <n-button type="primary" quaternary size="small" tag="a" :href="data.telegram_bind_url"> 点击绑定 </n-button>
              </template>
            </n-thing>
          </n-list-item>
          <template v-if="data.is_viewing">
            <n-list-item>
              <n-thing title="是否显示空媒体资源" description="可以当个海报墙看呀">
                <template #header-extra> <n-switch v-model:value="data.is_show_empty" :loading="show_empty_loading" @change="changeShowEmpty" /></template>
              </n-thing>
            </n-list-item>
            <n-list-item v-if="!data.is_can_upload">
              <n-thing title="上传权限" description="阅读上传须知后自会获得">
                <template #header-extra>
                  <n-button type="warning" quaternary size="small" @click="showUploadAgreement"> 点击阅读 </n-button>
                </template>
              </n-thing>
            </n-list-item>
            <n-list-item v-if="data.invite_remaining">
              <n-thing title="邀请伙伴">
                <template #description>
                  <p>发邀须谨慎，连坐泪两行。</p>
                  <p>
                    <template v-if="data.roles.includes('admin')"> 尊敬的管理员，您可以无限发邀。</template>
                    <template v-else>可邀 {{ data.invite_remaining }} 人。</template>
                  </p>
                </template>
                <template #header-extra>
                  <n-button type="error" quaternary size="small" @click="inviteShow"> 点击邀请 </n-button>
                </template>
              </n-thing>
            </n-list-item>
          </template>
        </n-list>
      </template>
      <template #action>
        <div class="flex justify-between">
          <n-tooltip trigger="hover" v-if="invite_info.invite_at">
            <template #trigger> 邀请人: {{ invite_info.parent.pseudonym || invite_info.parent.user_id }} </template>
            邀请时间: {{ invite_info.invite_at }}
          </n-tooltip>
          <p v-if="invite_info.invite_count">
            <n-button text @click="inviteHistory"> 已邀请: {{ invite_info.invite_count }} 人 </n-button>
          </p>
        </div>
      </template>
    </n-card>
  </div>
</template>
<script setup lang="tsx">
  import { useClipboard } from '@vueuse/core'
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import instance from '@/utils/ky'
  import signStore from '@/stores/sign.ts'
  import { nDialog, nMessage, nModel } from '@/utils/naive'
  import { ROUTE_NAME_INDEX } from '@/router'
  import { dayjs } from '@common/dayjs'

  const storeSign = signStore(),
    router = useRouter()

  const USER_ROLES = {
    admin: '管理员',
    dev: '开发者',
    special: '特邀用户',
    sponsor: '赞助者',
    peer: '同行',
  }

  const loading = ref(true),
    data = ref({}),
    getData = async () => {
      loading.value = true

      let res = await instance.get('/api/user').json()

      let user_roles_string = []
      for (let role of res.roles) {
        let user_role_string = USER_ROLES[role]
        if (user_role_string) {
          user_roles_string.push(user_role_string)
        }
      }

      data.value = {
        ...res,
        user_roles_string: user_roles_string.join('、'),
      }

      loading.value = false

      inviteGetInfo()
    }

  getData()

  const showUserBase = () => {
      if (loading.value) {
        return
      }
      let user_id = data.value.user_id
      let { copy } = useClipboard()
      nDialog().success({
        title: `用户ID: ${user_id}`,
        content: () => (
          <p>
            当前密钥: <code>{storeSign.user_token}</code>
          </p>
        ),
        showIcon: false,
        negativeButtonProps: {
          type: 'error',
        },
        negativeText: '重置密钥',
        positiveText: '点击复制用户ID',
        onPositiveClick: () => {
          copy(user_id)
          nMessage().success('复制成功')
        },
        onNegativeClick: () => {
          instance.put('/api/user/resetToken').then(async (res) => {
            let { token } = await res.json()
            storeSign.tokenSet(token)
            nMessage().success('重置成功')
          })
        },
      })
    },
    copyEmyaUrl = () => {
      let { copy } = useClipboard()
      copy(data.value.emya_url)
      nMessage().success('复制成功')
    }

  const emya_login_password_loading = ref(false),
    emyaGetLoginPassword = () => {
      emya_login_password_loading.value = true
      instance
        .get('/api/emya/getLoginPassword')
        .then(async (res) => {
          let { password, second } = await res.json()
          if (password) {
            let { copy } = useClipboard()
            nDialog().success({
              title: `一次性登录密码为: ${password}, ${second}秒内有效`,
              showIcon: false,
              positiveText: '点击复制',
              onPositiveClick: () => {
                copy(password)
                nMessage().success('复制成功')
              },
            })
          } else {
            nMessage().success('您可以直接使用当前账号密码进行登录')
          }
        })
        .finally(() => {
          emya_login_password_loading.value = false
        })
    },
    emyaResetPassword = () => {
      let new_password = ref(Math.random().toFixed(6).slice(-6)),
        password_loading = ref(false)
      let model = nModel().create({
        maskClosable: false,
        title: `请输入新的固定登录密码`,
        preset: 'card',
        style: {
          width: '80%',
          maxWidth: '400px',
        },
        content: () => <n-input v-model:value={new_password.value} type="text" placeholder="请输入新的固定登录密码" maxlength="30" clearable />,
        footer: () => (
          <n-button
            tertiary
            class="float-right"
            type="primary"
            loading={password_loading.value}
            onClick={() => {
              let password = new_password.value
              if (!password) {
                nMessage().error(`新登录密码 不可为空`)
                return
              }

              password_loading.value = true
              instance
                .put('/api/emya/resetPassword', {
                  json: {
                    password,
                  },
                })
                .then(() => {
                  nMessage().success(`新的固定登录密码为 ${password}`)
                  data.value.emya_password = password
                  let { copy } = useClipboard()
                  copy(password)
                  model.destroy()
                })
                .finally(() => {
                  password_loading.value = false
                })
            }}
          >
            提交
          </n-button>
        ),
      })
    }

  const show_empty_loading = ref(false),
    changeShowEmpty = (value) => {
      show_empty_loading.value = true
      instance
        .put('/api/user/showEmpty')
        .then(async (res) => {
          let { is_show_empty } = await res.json()
          data.value.is_show_empty = is_show_empty
        })
        .finally(() => {
          show_empty_loading.value = false
        })
    }

  const showUploadAgreement = () => {
    nDialog().success({
      style: {
        width: '450px',
      },
      title: `在上传之前，请审视您的文件：`,
      content: () => (
        <div>
          <p>
            若它承载着光明与欢笑，无惧在阳光下共赏，请归档于
            <n-button text tag="a" href="https://wiki.emos.best" target="_blank">
              &nbsp;emos；
            </n-button>
          </p>
          <p>
            若它涌动着本能与躁动，只属于深夜的独白，请封印于
            <n-button text tag="a" href="https://empn.mom" target="_blank">
              &nbsp;empn。
            </n-button>
          </p>
          <p>秩序与混乱，仅在一念之间。</p>
        </div>
      ),
      showIcon: false,
      negativeText: '我再想想',
      positiveText: '认可并同意',
      onPositiveClick: () => {
        instance.put('/api/user/agreeUploadAgreement').then(() => {
          data.value.is_can_upload = true
        })
      },
    })
  }

  const invite_info = ref({}),
    inviteShow = () => {
      let invite_user_id = ref(null),
        invite_loading = ref(false)
      let model = nModel().create({
        maskClosable: false,
        title: `邀请伙伴`,
        preset: 'card',
        style: {
          width: '80%',
          maxWidth: '400px',
        },
        content: () => <n-input v-model:value={invite_user_id.value} type="text" placeholder="请输入对方用户ID" maxlength="10" />,
        footer: () => (
          <n-button
            tertiary
            class="float-right"
            type="primary"
            loading={invite_loading.value}
            onClick={() => {
              let value = invite_user_id.value
              if (!value) {
                nMessage().error(`用户ID 不可为空`)
                return
              }

              if (value.length != 10) {
                nMessage().error(`用户ID 输入错误`)
                return
              }

              invite_loading.value = true
              instance
                .post('/api/invite', {
                  json: {
                    invite_user_id: value,
                  },
                })
                .then(async (res) => {
                  nMessage().success(`邀请成功`)
                  let { invite_remaining } = await res.json()
                  data.value.invite_remaining = invite_remaining
                  invite_info.value.invite_count += 1
                  model.destroy()
                })
                .finally(() => {
                  invite_loading.value = false
                })
            }}
          >
            邀请
          </n-button>
        ),
      })
    },
    inviteGetInfo = () => {
      instance.get('/api/invite/info').then(async (res) => {
        invite_info.value = await res.json()
      })
    },
    inviteHistory = () => {
      let history_columns = [
          {
            title: '邀请时间',
            key: 'invite_at',
            width: 120,
            render: (row) => dayjs(row.invite_at).format('MM-DD HH:mm'),
          },
          {
            title: 'ID',
            key: 'user_id',
            width: 130,
          },
          {
            title: '用户名',
            key: 'username',
            minWidth: 150,
          },
        ],
        history_data = ref([]),
        history_loading = ref(false),
        historyGet = () => {
          history_loading.value = true
          instance
            .get('/api/invite/history', {
              searchParams: {
                page: 1,
                page_size: 100,
              },
            })
            .then(async (res) => {
              let data = await res.json()
              history_data.value = data.items
            })
            .finally(() => {
              history_loading.value = false
            })
        }

      historyGet()

      nModel().create({
        maskClosable: false,
        title: `最近邀请的100人`,
        preset: 'card',
        style: {
          width: '80%',
          maxWidth: '600px',
        },
        content: () => <n-data-table columns={history_columns} data={history_data.value} max-height="300px" loading={history_loading.value} />,
      })
    }
</script>
<style scoped lang="stylus"></style>
