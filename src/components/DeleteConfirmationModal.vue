<template functional>
  <div class="vqb-modal">
    <div class="vqb-modal__backdrop"></div>
    <div class="vqb-modal__container">
      <div class="vqb-modal__body" style="width: 500px;">
        <i class="vqb-modal__close fas fa-times" @click="listeners['cancelDelete']"></i>
        <div class="vqb-modal__header">
          <div class="vqb-modal__title">Delete this step?</div>
        </div>
        <div class="vqb-modal__section">
          <div class="vqb-modal__text">Are you sure you want to delete this step?</div>
          <strong class="vqb-modal__text">
            This action cannot be undone and may create
            conflicts with following steps if any.
          </strong>
        </div>
        <div class="vqb-modal__footer">
          <div
            class="vqb-modal__action vqb-modal__action--secondary"
            @click="listeners['cancelDelete']"
          >cancel</div>
          <div
            class="vqb-modal__action vqb-modal__action--primary"
            @click="listeners['validateDelete']"
          >confirm</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
/**
 * @name DeleteConfirmationModal
 * @description A modal asking for confirmation before deleting a step
 */
export default {
  name: 'delete-confirmation-modal',
};
</script>

<style lang="scss" scoped>
@import '../styles/DeleteConfirmationModal';
</style>
