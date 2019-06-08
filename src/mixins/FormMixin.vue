<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Ajv, { ValidateFunction, ErrorObject } from 'ajv';

type VqbError = Partial<ErrorObject>;

@Component
export default class FormMixin extends Vue {
  errors?: VqbError[] | null = null;
  validator: ValidateFunction = () => false;
  schema: object = {};

  mounted() {
    this.validator = Ajv({ schemaId: 'auto', allErrors: true }).compile(this.schema);
  }
}
</script>
