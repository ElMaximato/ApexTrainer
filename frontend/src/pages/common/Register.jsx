import React from "react";
import { Button, Form } from "semantic-ui-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { registerApi } from "../../api/user";

export function Register() {
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: initialValues(),
    validationSchema: validationSchema(),
    onSubmit: async (formValues) => {
      try {
        // confirmPassword solo se usa para validar, no se envía al backend
        const { confirmPassword, ...datos } = formValues;
        await registerApi(datos);
        toast.success("Cuenta creada. Ya puedes iniciar sesión");
        navigate("/login");
      } catch (error) {
        toast.error(error.message);
      }
    },
  });

  return (
    <div className="login-admin">
      <div className="login-admin__content">
        <h1>Crear cuenta</h1>
        <Form className="login-form-admin" onSubmit={formik.handleSubmit}>
          <Form.Input
            name="first_name"
            placeholder="Nombre"
            value={formik.values.first_name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.first_name && formik.errors.first_name}
          />
          <Form.Input
            name="last_name"
            placeholder="Apellido"
            value={formik.values.last_name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.last_name && formik.errors.last_name}
          />
          <Form.Input
            name="email"
            placeholder="Correo electrónico"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && formik.errors.email}
          />
          <Form.Input
            name="password"
            type="password"
            placeholder="Contraseña"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.password && formik.errors.password}
            autoComplete="new-password"
          />
          <Form.Input
            name="confirmPassword"
            type="password"
            placeholder="Confirmar contraseña"
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.confirmPassword && formik.errors.confirmPassword}
            autoComplete="new-password"
          />
          <Button
            type="submit"
            content="Registrarme"
            primary
            fluid
            loading={formik.isSubmitting}
          />
        </Form>
        <p className="login-admin__link">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}

function initialValues() {
  return {
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  };
}

function validationSchema() {
  return Yup.object({
    first_name: Yup.string().required("El nombre es obligatorio"),
    last_name: Yup.string().required("El apellido es obligatorio"),
    email: Yup.string()
      .email("Correo electrónico no válido")
      .required("El correo electrónico es obligatorio"),
    password: Yup.string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .required("La contraseña es obligatoria"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], "Las contraseñas no coinciden")
      .required("Confirma tu contraseña"),
  });
}
