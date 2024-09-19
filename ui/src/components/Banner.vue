<template>
	<div class="banner">
		<div class="banner-icon">
			<FAIcon icon="info" />
		</div>
		<div class="banner-content">
			<slot />
		</div>
	</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	name: 'banner',
});
</script>

<style lang="scss" scoped>
.banner {
	display: flex;
	align-items: center;
	padding: 8px 16px;
	gap: 8px;
	color: #126EFF;
	background-color: #E0ECFF;
	border-radius: 4px;
}

.banner-icon {
	display: flex;
	width: 16px;
	height: 16px;
}

.banner-content {
	display: flex;
	align-items: center;
	gap: 8px;
	font-weight: '500';
	font-size: '.875rem';
	line-height: '150%';
}
</style>
