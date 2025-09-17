import React, { useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { createFuncionario, updateFuncionario } from "../../service/FuncionarioService";
import type { Employee } from "../../types";
import { toast } from "react-toastify";

interface EmployeeFormProps {
  initialData?: Employee | null;
  onCancel: () => void;
  onSave: (id?: string) => void;  // retorna ID do novo funcionário
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({ initialData, onCancel, onSave }) => {
  const [formData, setFormData] = useState<Omit<Employee, "_id">>({
    nome: initialData?.nome || "",
    sobrenome: initialData?.sobrenome || "",
    nif: initialData?.nif || "",
  });

  const [loading, setLoading] = useState(false);
  const [nifError, setNifError] = useState("");

  const handleNifChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 14) {
      setFormData((prev) => ({ ...prev, nif: value }));
      if (value.length > 0 && value.length < 14) {
        setNifError("O NIF deve conter 14 números.");
      } else {
        setNifError("");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.nif.length !== 14) {
      setNifError("O NIF deve conter exatamente 14 números.");
      return;
    }

    try {
      setLoading(true);
      let savedId: string | undefined;
      if (initialData?._id) {
        await updateFuncionario(initialData._id, formData);
        toast.success("Funcionário atualizado com sucesso!");
        savedId = initialData._id;
      } else {
        const newEmployee = await createFuncionario(formData);
        toast.success("Funcionário criado com sucesso!");
        savedId = newEmployee._id; // backend deve devolver o id
        setFormData({ nome: "", sobrenome: "", nif: "" });
      }
      onSave(savedId); // 🔹 Atualiza lista + destaca novo funcionário
      onCancel();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar funcionário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome *
          </label>
          <Input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            placeholder="Nome do funcionário"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sobrenome *
          </label>
          <Input
            type="text"
            name="sobrenome"
            value={formData.sobrenome}
            onChange={handleChange}
            placeholder="Sobrenome do funcionário"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            NIF *
          </label>
          <Input
            type="text"
            name="nif"
            value={formData.nif}
            onChange={handleNifChange}
            placeholder="NIF do funcionário"
            required
            // maxLength={14}
          />
          {nifError && (
            <p className="text-xs text-red-500 mt-1">{nifError}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button variant="outline" onClick={onCancel} type="button">
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading
            ? "Salvando..."
            : initialData
            ? "Salvar Alterações"
            : "Cadastrar Funcionário"}
        </Button>
      </div>
    </form>
  );
};
