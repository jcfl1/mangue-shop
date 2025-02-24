import { Fornecedor } from "./fornecedor";
import { DBService} from "./../database/database";

const Joi = require('@hapi/joi');

// Variaveis para o envio de email
var nodemailer = require('nodemailer');
var hbs = require('nodemailer-express-handlebars');
const path = require('path');
const MANGUE_SHOP_EMAIL = "mangueshopcompany@gmail.com";
const MANGUE_SHOP_PASSWORD = 'kcyghcrtehwofnkl';
const path_to_email_assets = __dirname + "/../../src";

export class FornecedorService{
    fornecedores: DBService;
    idCount: number;

    // Construtor da classe, carrega o DB
    constructor() {
        this.fornecedores = new DBService('fornecedores');
        this.idCount = this.fornecedores.getIdCount();
    }

    add(fornecedorRecebido: any): string{

        if (this.isEmailRegistered(fornecedorRecebido['email']) ) return "O email inserido não pode ser cadastrado pois já existe no banco de dados";
    


        if(fornecedorRecebido['tipo']==='PF'){
            if (this.isCPF_CPNJRegistered(fornecedorRecebido['CPF_CNPJ']) ) return "O CPF inserido não pode ser cadastrado pois já existe no banco de dados";
            var val = this.validateRegistrationPF(fornecedorRecebido);      
            if(val['error']){
                return "Houve o seguinte erro de validação no servidor: " + val['error'];
            }      
        }
        else if(fornecedorRecebido['tipo']==='PJ'){
            if (this.isCPF_CPNJRegistered(fornecedorRecebido['CPF_CNPJ']) ) return "O CPNJ inserido não pode ser cadastrado pois já existe no banco de dados";
            var val = this.validateRegistrationPJ(fornecedorRecebido);      
            if(val['error']){
                return "Houve o seguinte erro de validação no servidor: " + val['error'];
            }               
        }
        else{
            return "Houve um erro de validação na sua requisição";
        }

        // console.log("Fornecedor recebido foi validado!\n");

        var newFornecedor = new Fornecedor({
            id: this.idCount,
            nome_razao: fornecedorRecebido['nome_razao'],
            CPF_CNPJ: fornecedorRecebido['CPF_CNPJ'],
            pais: fornecedorRecebido['pais'],
            estado: fornecedorRecebido['estado'],
            bairro: fornecedorRecebido['bairro'],
            rua: fornecedorRecebido['rua'],
            numero: fornecedorRecebido['numero'],
            complemento: fornecedorRecebido['complemento'],
            nome_exibicao: fornecedorRecebido['nome_exibicao'],
            imagem: fornecedorRecebido['imagem'],
            descricao: fornecedorRecebido['descricao'],
            email: fornecedorRecebido['email'],
            senha: fornecedorRecebido['senha'],
            tipo: fornecedorRecebido['tipo'],
            despachar: ['ABC123',"JP115"],
            num_despachar: 2
        });

        this.fornecedores.add(newFornecedor);
        this.idCount++;

        // console.log("Novo fornecedor adicionado!\n");
        // console.log(newFornecedor);

        return "Sucesso";
    }

    update(fornecedor: any): string {
        var data = this.fornecedores.getData().find(({ id }: any) => id == fornecedor.id);

        delete fornecedor.id;

        if(fornecedor.email !== data.email){
          if (this.isEmailRegistered(fornecedor['email']) ) return "O email inserido não pode ser cadastrado pois já existe no banco de dados";
        }

        if(fornecedor['tipo']==='PF'){
            var val = this.validateRegistrationPF(fornecedor);      
            if(val['error']){
                return "Houve o seguinte erro de validação no servidor: " + val['error'];
            }      
        }
        else if(fornecedor['tipo']==='PJ'){
            var val = this.validateRegistrationPJ(fornecedor);      
            if(val['error']){
                return "Houve o seguinte erro de validação no servidor: " + val['error'];
            }               
        }
        else{
            return "Houve um erro de validação na sua requisição";
        }

        // console.log("Fornecedor recebido foi validado!\n");

        if (data){
            var fornecedorUpdate = new Fornecedor(data);
            fornecedorUpdate.pais = fornecedor.pais;
            fornecedorUpdate.estado = fornecedor.estado;
            fornecedorUpdate.bairro = fornecedor.bairro;
            fornecedorUpdate.rua = fornecedor.rua;
            fornecedorUpdate.numero = fornecedor.numero;
            fornecedorUpdate.complemento = fornecedor.complemento;
            fornecedorUpdate.nome_exibicao = fornecedor.nome_exibicao;
            fornecedorUpdate.imagem = fornecedor.imagem;
            fornecedorUpdate.descricao = fornecedor.descricao;
            fornecedorUpdate.senha = fornecedor.senha;
            fornecedorUpdate.email = fornecedor.email;

            var index = this.fornecedores.getData().indexOf(data);
            this.fornecedores.update(index, fornecedorUpdate);
            // console.log("Fornecedor atualizado com sucesso\n");
            return "Sucesso";
        }
        return "Houve um erro não esperado";
    }

    delete(deleteObject: any): string{
      const delete_id = deleteObject['id'];
      const delete_email = deleteObject['email'];
      const delete_password = deleteObject['senha'];
      
      var data = this.fornecedores.getData().find(({ id }: any) => id == delete_id);
      if(data){
        if(data['email'] == delete_email && data['senha'] == delete_password){
          var index = this.fornecedores.getData().indexOf(data);
          // console.log("Vou deletar o de id: " + delete_id + "que eh o index: " + index);
          this.fornecedores.delete(index);
          return "Sucesso";
        }
        return "Houve um erro na validação das credenciais do fornecedor";
      }
      return "Houve um erro na validação das credenciais do fornecedor";
    }

    // Only Update password!
    update_password(pacote: any){
      var fornecedor_to_change = this.getByEmail(pacote.email);
      var index = this.fornecedores.getData().indexOf(fornecedor_to_change);

      fornecedor_to_change.senha = pacote.new_password;
      this.fornecedores.update(index, fornecedor_to_change);
      // console.log("Senha Atualizada!");
      return true;
    }

    get() : Fornecedor[] {
        return this.fornecedores.getData();
    }

    getById(fornecedorId: number) : Fornecedor {
        return this.fornecedores.getData().find(({ id }: any) => id == fornecedorId);
    }

    getByEmail(fornecedorEmail: string) : Fornecedor {
        return this.fornecedores.getData().find(({ email }: any) => email == fornecedorEmail);
    }

    isCPF_CPNJRegistered(cpf_cnpj: string): boolean {
        return this.fornecedores.getData().find( (f : Fornecedor) => f.CPF_CNPJ === cpf_cnpj) ? true : false;
    }

    isEmailRegistered(email: string): boolean {
        return this.fornecedores.getData().find( ( f : Fornecedor) => f.email == email) ? true : false;
    }

    /** Verifies if given code is present inside the dispachable codes array for that 
     * specific suplier */
    isCodeExists(pacote: any): boolean {
      //console.log("isCodeExists: ");
      //console.log(pacote);
      var curr_fornecedor = this.getByEmail(pacote.email);
      //console.log(curr_fornecedor);
      var codigo = pacote.codigo;
      var result = curr_fornecedor.despachar.find( ( s : string) => s == codigo) ? true : false;
      //console.log("O codigo foi encontrado:"+ result)
      return result;
    }
    
    // Autenticação para o Login
    authenticate(email: string, password: string): boolean {
        var fornecedor = this.getByEmail(email);
        if(fornecedor && fornecedor.senha == password){
            // console.log("Authenticate: Success");
            return true;
        }
        return false;
    }

    validateRegistrationPF(fornecedor: any): any{

      const schema = Joi.object({
          nome_razao: Joi.string().pattern(new RegExp('^[a-zA-Z \']{5,80}$')).required().messages({
            'string.base': `O campo "Nome" deve ser do tipo 'text'`,
            'string.empty': `O campo "Nome" não pode ser vazio`,
            'string.pattern.base': `O campo "Nome" pode ter somente caracteres sem acento do alfabeto e deve ter entre 5 e 80 caracteres`,
            'any.required': `O campo "Nome" é um campo obrigatório`
          }),
          CPF_CNPJ: Joi.string().pattern(new RegExp('^[0-9]{11}$')).required().messages({
            'string.base': `O campo "CPF" deve ser do tipo 'text'`,
            'string.empty': `O campo "CPF" não pode ser vazio`,
            'string.pattern.base': `O campo "CPF" deve ser composto somente por dígitos numéricos correspondentes a um CPF`,
            'any.required': `O campo "CPF" é um campo obrigatório`
          }),
          pais: Joi.string().pattern(new RegExp('^[a-zA-Z \']{2,80}$')).required().messages({
            'string.base': `O campo "País" deve ser do tipo 'text'`,
            'string.empty': `O campo "País" não pode ser vazio`,
            'string.pattern.base': `O campo "País" deve ser composto somente por caracteres sem acento do alfabeto e deve ter entre 2 e 80 caracteres`,
            'any.required': `O campo "País" é um campo obrigatório`
          }),
          estado: Joi.string().pattern(new RegExp('^[a-zA-Z \']{2,80}$')).required().messages({
            'string.base': `O campo "Estado" deve ser do tipo 'text'`,
            'string.empty': `O campo "Estado" não pode ser vazio`,
            'string.pattern.base': `O campo "Estado" deve ser composto somente por caracteres sem acento do alfabeto e deve ter entre 2 e 80 caracteres`,
            'any.required': `O campo "Estado" é um campo obrigatório`
          }),
          bairro: Joi.string().pattern(new RegExp('^[a-zA-Z \']{2,80}$')).required().messages({
            'string.base': `O campo "Bairro" deve ser do tipo 'text'`,
            'string.empty': `O campo "Bairro" não pode ser vazio`,
            'string.pattern.base': `O campo "Bairro" deve ser composto somente por caracteres sem acento do alfabeto e deve ter entre 2 e 80 caracteres`,
            'any.required': `O campo "Bairro" é um campo obrigatório`
          }),
          rua: Joi.string().pattern(new RegExp('^[a-zA-Z0-9 \']{2,80}$')).required().messages({
            'string.base': `O campo "Rua" deve ser do tipo 'text'`,
            'string.empty': `O campo "Rua" não pode ser vazio`,
            'string.pattern.base': `O campo "Rua" deve ser composto somente por números e caracteres sem acento do alfabeto e deve ter entre 2 e 80 caracteres`,
            'any.required': `O campo "Rua" é um campo obrigatório`
          }),
          numero: Joi.string().pattern(new RegExp('^[0-9]{1,7}$')).allow(null, '').messages({
            'string.base': `O campo "Número" deve ser do tipo 'text'`,
            'string.pattern.base': `O campo "Número" deve ser composto somente por dígitos numéricos e deve ter entre 1 e 7 dígitos`
          }),
          complemento: Joi.string().pattern(new RegExp('^[a-zA-Z0-9 \']{2,80}$')).allow(null, '').messages({
            'string.base': `O campo "Complemento" deve ser do tipo 'text'`,
            'string.pattern.base': `O campo "Complemento" deve ser composto somente por números e caracteres sem acento do alfabeto e deve ter entre 2 e 80 caracteres`
          }),
          nome_exibicao: Joi.string().pattern(new RegExp('^[a-zA-Z0-9 \']{3,40}$')).required().messages({
            'string.base': `O campo "Nome Exibição" deve ser do tipo 'text'`,
            'string.empty': `O campo "Nome Exibição" não pode ser vazio`,
            'string.pattern.base': `O campo "Nome Exibição" deve ser composto somente por números e caracteres sem acento do alfabeto e deve ter entre 3 e 40 caracteres`,
            'any.required': `O campo "Nome Exibição" é um campo obrigatório`
          }),
          descricao: Joi.string().min(10).max(400).required().messages({
            'string.base': `O campo "Descrição" deve ser do tipo 'text'`,
            'string.min': `O campo "Descrição" deve ter pelo menos 10 caracteres`,
            'string.max': `O campo "Descrição" não pode ter mais do que 400 caracteres`,
            'any.required': `O campo "Descrição" é um campo obrigatório`
          }),
          imagem: Joi.string().allow(null, ''),
          email: Joi.string().pattern(new RegExp('^[a-zA-Z0-9\-\.+! \']{3,40}@[a-zA-Z0-9\-\.+!\\\n \']{3,40}.[a-zA-Z0-9\-\.+! \']{3,40}$')).required().messages({
            'string.base': `O campo "Email" deve ser do tipo 'text'`,
            'string.empty': `O campo "Email" não pode ser vazio`,
            'string.pattern.base': `O campo "Email" deve ter o formato de um email válido`,
            'any.required': `O campo "Email" é um campo obrigatório`
          }),
          senha: Joi.string().min(8).max(100).required().messages({
            'string.base': `O campo "Senha" deve ser do tipo 'text'`,
            'string.min': `O campo "Senha" deve ter pelo menos 8 caracteres`,
            'string.max': `O campo "Senha" não pode ter mais do que 100 caracteres`,
            'any.required': `O campo "Senha" é um campo obrigatório`
          }),
          confirmar_senha: Joi.any().equal(Joi.ref('senha')).required().messages({
            'string.base': `O campo "Confirmar senha" deve ser do tipo 'text'`,
            'any.only': `O campo "Confirmar senha" deve ter uma senha igual a do campo "Senha"`,
            'any.required': `O campo "Confirmar senha" é um campo obrigatório`
          }),
          tipo: Joi.string().pattern(new RegExp('^PF$')).required(),
          despachar: Joi.allow(null, ''),
          num_despachar: Joi.allow(null, ''),
      });
  
      return schema.validate(fornecedor);
    }
  
    validateRegistrationPJ(fornecedor: any): any{
  
      const schema = Joi.object({
          nome_razao: Joi.string().pattern(new RegExp('^[a-zA-Z \']{5,80}$')).required().messages({
            'string.base': `O campo "Razão Social" deve ser do tipo 'text'`,
            'string.empty': `O campo "Razão Social" não pode ser vazio`,
            'string.pattern.base': `O campo "Razão Social" pode ter somente caracteres sem acento do alfabeto e deve ter entre 5 e 80 caracteres`,
            'any.required': `O campo "Razão Social" é um campo obrigatório`
          }),
          CPF_CNPJ: Joi.string().pattern(new RegExp('^[0-9]{14}$')).required().messages({
            'string.base': `O campo "CNPJ" deve ser do tipo 'text'`,
            'string.empty': `O campo "CNPJ" não pode ser vazio`,
            'string.pattern.base': `O campo "CNPJ" deve ser composto somente por dígitos numéricos correspondentes a um CNPJ`,
            'any.required': `O campo "CNPJ" é um campo obrigatório`
          }),
          pais: Joi.string().pattern(new RegExp('^[a-zA-Z \']{2,80}$')).required().messages({
            'string.base': `O campo "País" deve ser do tipo 'text'`,
            'string.empty': `O campo "País" não pode ser vazio`,
            'string.pattern.base': `O campo "País" deve ser composto somente por caracteres sem acento do alfabeto e deve ter entre 2 e 80 caracteres`,
            'any.required': `O campo "País" é um campo obrigatório`
          }),
          estado: Joi.string().pattern(new RegExp('^[a-zA-Z \']{2,80}$')).required().messages({
            'string.base': `O campo "Estado" deve ser do tipo 'text'`,
            'string.empty': `O campo "Estado" não pode ser vazio`,
            'string.pattern.base': `O campo "Estado" deve ser composto somente por caracteres sem acento do alfabeto e deve ter entre 2 e 80 caracteres`,
            'any.required': `O campo "Estado" é um campo obrigatório`
          }),
          bairro: Joi.string().pattern(new RegExp('^[a-zA-Z \']{2,80}$')).required().messages({
            'string.base': `O campo "Bairro" deve ser do tipo 'text'`,
            'string.empty': `O campo "Bairro" não pode ser vazio`,
            'string.pattern.base': `O campo "Bairro" deve ser composto somente por caracteres sem acento do alfabeto e deve ter entre 2 e 80 caracteres`,
            'any.required': `O campo "Bairro" é um campo obrigatório`
          }),
          rua: Joi.string().pattern(new RegExp('^[a-zA-Z0-9 \']{2,80}$')).required().messages({
            'string.base': `O campo "Rua" deve ser do tipo 'text'`,
            'string.empty': `O campo "Rua" não pode ser vazio`,
            'string.pattern.base': `O campo "Rua" deve ser composto somente por números e caracteres sem acento do alfabeto e deve ter entre 2 e 80 caracteres`,
            'any.required': `O campo "Rua" é um campo obrigatório`
          }),
          numero: Joi.string().pattern(new RegExp('^[0-9]{1,7}$')).allow(null, '').messages({
            'string.base': `O campo "Número" deve ser do tipo 'text'`,
            'string.pattern.base': `O campo "Número" deve ser composto somente por dígitos numéricos e deve ter entre 1 e 7 dígitos`
          }),
          complemento: Joi.string().pattern(new RegExp('^[a-zA-Z0-9 \']{2,80}$')).allow(null, '').messages({
            'string.base': `O campo "Complemento" deve ser do tipo 'text'`,
            'string.pattern.base': `O campo "Complemento" deve ser composto somente por números e caracteres sem acento do alfabeto e deve ter entre 2 e 80 caracteres`
          }),
          nome_exibicao: Joi.string().pattern(new RegExp('^[a-zA-Z0-9 \']{3,40}$')).required().messages({
            'string.base': `O campo "Nome Exibição" deve ser do tipo 'text'`,
            'string.empty': `O campo "Nome Exibição" não pode ser vazio`,
            'string.pattern.base': `O campo "Nome Exibição" deve ser composto somente por números e caracteres sem acento do alfabeto e deve ter entre 3 e 40 caracteres`,
            'any.required': `O campo "Nome Exibição" é um campo obrigatório`
          }),
          descricao: Joi.string().min(10).max(400).required().messages({
            'string.base': `O campo "Descrição" deve ser do tipo 'text'`,
            'string.min': `O campo "Descrição" deve ter pelo menos 10 caracteres`,
            'string.max': `O campo "Descrição" não pode ter mais do que 400 caracteres`,
            'any.required': `O campo "Descrição" é um campo obrigatório`
          }),
          imagem: Joi.string().allow(null, ''),
          email: Joi.string().pattern(new RegExp('^[a-zA-Z0-9\-\.+! \']{3,40}@[a-zA-Z0-9\-\.+!\\\n \']{3,40}.[a-zA-Z0-9\-\.+! \']{3,40}$')).required().messages({
            'string.base': `O campo "Email" deve ser do tipo 'text'`,
            'string.empty': `O campo "Email" não pode ser vazio`,
            'string.pattern.base': `O campo "Email" deve ter o formato de um email válido`,
            'any.required': `O campo "Email" é um campo obrigatório`
          }),
          senha: Joi.string().min(8).max(100).required().messages({
            'string.base': `O campo "Senha" deve ser do tipo 'text'`,
            'string.min': `O campo "Senha" deve ter pelo menos 8 caracteres`,
            'string.max': `O campo "Senha" não pode ter mais do que 100 caracteres`,
            'any.required': `O campo "Senha" é um campo obrigatório`
          }),
          confirmar_senha: Joi.any().equal(Joi.ref('senha')).required().messages({
            'string.base': `O campo "Confirmar senha" deve ser do tipo 'text'`,
            'any.only': `O campo "Confirmar senha" deve ter uma senha igual a do campo "Senha"`,
            'any.required': `O campo "Confirmar senha" é um campo obrigatório`
          }),
          tipo: Joi.string().pattern(new RegExp('^PJ$')).required(),
          despachar: Joi.allow(null, ''),
          num_despachar: Joi.allow(null, ''),
      });
  
      return schema.validate(fornecedor);
    }

    // async permite a execução da função assincrona
    // e a utilização de wait
    async forgot_password(email : string){
      var usuario = this.getByEmail(email);
      // console.log("Sending email to: " + email);
      if(usuario){
        await this.sendEmail({
          email: usuario.email,
          subject: "Mangue Shop - Link para redefinição de senha",
          template: "forgot_password",
          context:{
            id: usuario.email
          }
        });
        return true;
      }
      return false;
    }

    // https://medium.com/@surabhisahay307/how-to-use-nodemailer-in-angular-dcbc9c048646
    sendEmail(body: any){
      return new Promise((resolve, reject) => {
          
          // Instanciando modulo para envio
          var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user : MANGUE_SHOP_EMAIL,
              pass: MANGUE_SHOP_PASSWORD
            }
          });
          
          // Loading template email
          transporter.use('compile', hbs({
            viewEngine: {
                extname: '.handlebars',
                defaultLayout: body.template,
                layoutsDir: path.join(path_to_email_assets, 'email-assets')
            },
            viewPath: path.join(path_to_email_assets, 'email-assets')
          }));

          // Config to mail
          var mailOptions = {
            from: MANGUE_SHOP_EMAIL,
            to: body.email,
            subject: body.subject,
            template: body.template,
            context: body.context
          };
          
          // Enviando
          transporter.sendMail(mailOptions, function(error: any, info: any){
            if(!error){
              // console.log("SUCESS! sent to " + body.email);
              resolve(true);
            }
            else{
              console.log(error);
              resolve(false);
            }
          });
      });
    }

    /** Verifies if given dispach code is present in the user's database and update it if true */
    despachar(pacote: any): Boolean{
      const email = pacote.email;
      const codigo = pacote.codigo;
      //console.log(email)
      //console.log(codigo)

      if(this.isCodeExists(pacote)){
        // Code found inside fornecedor
        //console.log("o codigo foi encontrado")
        this.update_despacho(pacote);
        return true;
      }
      else{
        return false;
      }
    }

    /** Updates the dispach array containing the dispachable codes, removing the code supplied from the array 
     * and also updates the total number of codes present in the database for that user */
    update_despacho(pacote: any){
      var fornecedor_to_change = this.getByEmail(pacote.email);
      var index = this.fornecedores.getData().indexOf(fornecedor_to_change);
      //console.log(index)
      var position = fornecedor_to_change.despachar.indexOf(pacote.codigo);
      //console.log("position:" + position)
      fornecedor_to_change.despachar.splice(position,1);
      //console.log(fornecedor_to_change.despachar);
      fornecedor_to_change.num_despachar = fornecedor_to_change.num_despachar -1;
      this.fornecedores.update(index, fornecedor_to_change);
      //console.log("DESPACHO Atualizado!");
      //console.log("Lista de fornecedores:")
      //console.log(this.fornecedores.data);
      return true;
    }
}