"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type CustomerAddress = {
  customer_address_id: string;
  customer_address_line: string;
  customer_address_ward: string | null;
  customer_address_province: string | null;
  customer_address_default: boolean;
};

type CustomerProfile = {
  customer_id: string;
  customer_user_id: string;
  customer_code: string;
  customer_full_name: string | null;
  customer_date_of_birth: string | null;
  customer_gender: string | null;
  customer_status: string;
  addresses: CustomerAddress[];
};

function formatDate(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "long",
  }).format(date);
}

function getStatusLabel(status: string) {
  if (status === "ACTIVE") return "Đang hoạt động";
  if (status === "INACTIVE") return "Không hoạt động";
  if (status === "LOCKED") return "Đã khóa";

  return status;
}

function getGenderLabel(gender: string | null) {
  if (!gender) return "";

  if (gender === "MALE") return "Nam";
  if (gender === "FEMALE") return "Nữ";
  if (gender === "OTHER") return "Khác";

  return gender;
}

export default function CustomerInformationPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<CustomerProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================
  // Edit customer information
  // =========================
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [formName, setFormName] = useState("");
  const [formDateOfBirth, setFormDateOfBirth] = useState("");
  const [formGender, setFormGender] = useState("");

  // =========================
  // Address
  // =========================
  const [deletingAddressId, setDeletingAddressId] =
    useState<string | null>(null);

  const [editingAddress, setEditingAddress] =
    useState<CustomerAddress | null>(null);

  const [savingAddress, setSavingAddress] = useState(false);
  const [addressEditError, setAddressEditError] = useState("");

  const [formAddressLine, setFormAddressLine] = useState("");
  const [formAddressWard, setFormAddressWard] = useState("");
  const [formAddressProvince, setFormAddressProvince] = useState("");
  const [formAddressDefault, setFormAddressDefault] = useState(false);

  // =========================
  // Add address
  // =========================
  const [addingAddress, setAddingAddress] = useState(false);
  const [savingNewAddress, setSavingNewAddress] = useState(false);
  const [addAddressError, setAddAddressError] = useState("");

  const [newAddressLine, setNewAddressLine] = useState("");
  const [newAddressWard, setNewAddressWard] = useState("");
  const [newAddressProvince, setNewAddressProvince] = useState("");
  const [newAddressDefault, setNewAddressDefault] = useState(false);

  function startAddingAddress() {
    setNewAddressLine("");
    setNewAddressWard("");
    setNewAddressProvince("");
    setNewAddressDefault(false);
    setAddAddressError("");
    setAddingAddress(true);
  }

  function closeAddingAddress() {
    if (savingNewAddress) return;

    setAddingAddress(false);
    setAddAddressError("");
  }

  // =========================
  // Load customer profile
  // =========================
  useEffect(() => {
    async function loadCustomerProfile() {
      const accessToken =
        localStorage.getItem("accessToken") ??
        sessionStorage.getItem("accessToken");

      if (!accessToken) {
        router.replace("/customer/login");
        return;
      }

      try {
        // 1. Lấy thông tin tài khoản để lấy user_id
        const userResponse = await fetch(
          "http://localhost:3001/auth/customer/me",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        if (userResponse.status === 401) {
          localStorage.removeItem("accessToken");
          sessionStorage.removeItem("accessToken");

          router.replace("/customer/login");
          return;
        }

        const userData = await userResponse.json();

        if (!userResponse.ok) {
          setError(
            userData.message ||
              "Không thể tải thông tin tài khoản.",
          );
          return;
        }

        // 2. Lấy user_id
        const userId = userData.user_id;

        if (!userId) {
          setError("Không tìm thấy mã người dùng.");
          return;
        }

        // 3. Gọi Customer Service
        const customerResponse = await fetch(
          `http://localhost:3002/api/v1/customer?userId=${encodeURIComponent(
            userId,
          )}`,
        );

        const customerData = await customerResponse.json();

        if (!customerResponse.ok) {
          setError(
            customerData.message ||
              "Không thể tải thông tin khách hàng.",
          );
          return;
        }

        setProfile(customerData);
      } catch {
        setError(
          "Không thể kết nối đến server. Vui lòng thử lại.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadCustomerProfile();
  }, [router]);

  // =========================
  // Open customer edit modal
  // =========================
  function startEditing() {
    if (!profile) return;

    setFormName(profile.customer_full_name ?? "");

    setFormDateOfBirth(
      profile.customer_date_of_birth
        ? profile.customer_date_of_birth.slice(0, 10)
        : "",
    );

    setFormGender(profile.customer_gender ?? "");

    setEditError("");
    setEditing(true);
  }

  // =========================
  // Close customer edit modal
  // =========================
  function closeEditing() {
    if (saving) return;

    setEditing(false);
    setEditError("");
  }

  // =========================
  // Save customer information
  // =========================
  async function saveCustomerProfile() {
    if (!profile) return;

    setSaving(true);
    setEditError("");

    try {
      const response = await fetch(
        `http://localhost:3002/api/v1/customer?userId=${encodeURIComponent(
          profile.customer_user_id,
        )}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer_full_name: formName.trim() || null,
            customer_date_of_birth: formDateOfBirth || null,
            customer_gender: formGender || null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setEditError(
          data.message ||
            "Không thể cập nhật thông tin khách hàng.",
        );
        return;
      }

      setProfile(data);
      setEditing(false);
    } catch {
      setEditError(
        "Không thể kết nối đến server. Vui lòng thử lại.",
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================
  // Open address edit modal
  // =========================
  function startEditingAddress(address: CustomerAddress) {
    setEditingAddress(address);

    setFormAddressLine(address.customer_address_line ?? "");
    setFormAddressWard(address.customer_address_ward ?? "");
    setFormAddressProvince(
      address.customer_address_province ?? "",
    );
    setFormAddressDefault(address.customer_address_default);

    setAddressEditError("");
  }

  // =========================
  // Close address edit modal
  // =========================
  function closeAddressEditing() {
    if (savingAddress) return;

    setEditingAddress(null);
    setAddressEditError("");
  }

  // =========================
  // Save address
  // =========================
  async function saveAddress() {
    if (!editingAddress) return;

    if (!formAddressLine.trim()) {
      setAddressEditError("Vui lòng nhập địa chỉ.");
      return;
    }

    setSavingAddress(true);
    setAddressEditError("");

    try {
      const response = await fetch(
        `http://localhost:3002/api/v1/customer/address?addressId=${encodeURIComponent(
          editingAddress.customer_address_id,
        )}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer_address_line: formAddressLine.trim(),
            customer_address_ward:
              formAddressWard.trim() || null,
            customer_address_province:
              formAddressProvince.trim() || null,
            customer_address_default: formAddressDefault,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setAddressEditError(
          data.message || "Không thể cập nhật địa chỉ.",
        );
        return;
      }

      // Cập nhật UI sau khi BE cập nhật thành công
      setProfile((current) => {
        if (!current) return current;

        return {
          ...current,
          addresses: current.addresses.map((address) => {
            // Địa chỉ đang chỉnh sửa
            if (
              address.customer_address_id ===
              editingAddress.customer_address_id
            ) {
              return {
                ...address,
                customer_address_line:
                  formAddressLine.trim(),
                customer_address_ward:
                  formAddressWard.trim() || null,
                customer_address_province:
                  formAddressProvince.trim() || null,
                customer_address_default:
                  formAddressDefault,
              };
            }

            // Nếu địa chỉ đang chỉnh sửa được đặt mặc định
            // thì các địa chỉ khác phải bỏ mặc định
            if (formAddressDefault) {
              return {
                ...address,
                customer_address_default: false,
              };
            }

            return address;
          }),
        };
      });

      setEditingAddress(null);
    } catch {
      setAddressEditError(
        "Không thể kết nối đến server. Vui lòng thử lại.",
      );
    } finally {
      setSavingAddress(false);
    }
  }

  // =========================
  // Delete address
  // =========================
  async function deleteAddress(addressId: string) {
    const confirmed = window.confirm(
      "Bạn có chắc chắn muốn xóa địa chỉ này không?",
    );

    if (!confirmed) return;

    setDeletingAddressId(addressId);

    try {
      const response = await fetch(
        `http://localhost:3002/api/v1/customer/address?addressId=${encodeURIComponent(
          addressId,
        )}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        window.alert(
          data.message || "Không thể xóa địa chỉ.",
        );
        return;
      }

      // Xóa địa chỉ khỏi UI sau khi BE xóa thành công
      setProfile((current) => {
        if (!current) return current;

        return {
          ...current,
          addresses: current.addresses.filter(
            (address) =>
              address.customer_address_id !== addressId,
          ),
        };
      });
    } catch {
      window.alert(
        "Không thể kết nối đến server. Vui lòng thử lại.",
      );
    } finally {
      setDeletingAddressId(null);
    }
  }

  //
  // Add address
  //
  async function saveNewAddress() {
    if (!profile) return;

    if (!newAddressLine.trim()) {
        setAddAddressError("Vui lòng nhập địa chỉ.");
        return;
    }

    setSavingNewAddress(true);
    setAddAddressError("");

    try {
        const response = await fetch(
        `http://localhost:3002/api/v1/customer/address?customerId=${encodeURIComponent(
            profile.customer_id,
        )}`,
        {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify({
            customer_address_line: newAddressLine.trim(),
            customer_address_ward: newAddressWard.trim() || null,
            customer_address_province:
                newAddressProvince.trim() || null,
            customer_address_default: newAddressDefault,
            }),
        },
        );

        const data = await response.json();

        if (!response.ok) {
        setAddAddressError(
            data.message || "Không thể thêm địa chỉ.",
        );
        return;
        }

        // Nếu BE trả về address vừa tạo
        const newAddress: CustomerAddress = data;

        setProfile((current) => {
        if (!current) return current;

        return {
            ...current,
            addresses: newAddressDefault
            ? [
                ...current.addresses.map((address) => ({
                    ...address,
                    customer_address_default: false,
                })),
                newAddress,
                ]
            : [...current.addresses, newAddress],
        };
        });

        setAddingAddress(false);
    } catch {
        setAddAddressError(
        "Không thể kết nối đến server. Vui lòng thử lại.",
        );
    } finally {
        setSavingNewAddress(false);
    }
    }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      {/* =========================
          Header
      ========================== */}
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#168b87]">
          Tài khoản
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#12313a]">
          Hồ sơ của tôi
        </h1>

        <p className="mt-2 text-sm text-[#70858b]">
          Quản lý thông tin tài khoản và thông tin khách hàng
          của bạn.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* =========================
            Sidebar
        ========================== */}
        <aside className="rounded-2xl border border-[#dce8e9] bg-white p-3 shadow-sm">
          <p className="px-3 pb-2 pt-1 text-xs font-bold uppercase tracking-[0.15em] text-[#8a9da1]">
            Danh mục hồ sơ
          </p>

          <nav className="space-y-1">
            <Link
              href="/customer/profile/account-information"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#526b71] transition hover:bg-[#f2f7f7] hover:text-[#168b87]"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#eef6f7] text-base">
                👤
              </span>

              <span>Thông tin tài khoản</span>
            </Link>

            <Link
              href="/customer/profile/customer-information"
              className="flex items-center gap-3 rounded-xl bg-[#e8f8f5] px-4 py-3 text-sm font-bold text-[#10736f]"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#168b87] text-base text-white">
                🪪
              </span>

              <span>Thông tin khách hàng</span>
            </Link>
          </nav>

          <div className="mx-3 my-4 border-t border-[#e4eeee]" />

          <p className="px-3 pb-1 text-xs leading-5 text-[#8a9da1]">
            Thông tin khách hàng bao gồm mã khách hàng, ngày
            sinh, giới tính và địa chỉ.
          </p>
        </aside>

        {/* =========================
            Main content
        ========================== */}
        <div className="overflow-hidden rounded-2xl border border-[#dce8e9] bg-white shadow-sm">
          {/* Title */}
          <div className="border-b border-[#e4eeee] px-5 py-5 sm:px-7">
            <h2 className="text-xl font-bold text-[#12313a]">
              Thông tin khách hàng
            </h2>

            <p className="mt-1 text-sm text-[#70858b]">
              Thông tin hồ sơ khách hàng của bạn.
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="grid min-h-72 place-items-center px-5 py-12">
              <div className="text-center">
                <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#dce8e9] border-t-[#168b87]" />

                <p className="mt-4 text-sm text-[#70858b]">
                  Đang tải thông tin khách hàng...
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="m-5 rounded-xl bg-[#fff0ee] px-4 py-3 text-sm text-[#c0392b] sm:m-7">
              {error}
            </div>
          )}

          {/* Customer information */}
          {!loading && profile && (
            <div className="p-5 sm:p-7">
              {/* Customer header */}
              <div className="mb-7 flex flex-col gap-4 border-b border-[#e4eeee] pb-7 sm:flex-row sm:items-center">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[#e8f8f5] text-2xl font-bold text-[#168b87]">
                  🪪
                </div>

                <div>
                  <h3 className="text-xl font-bold text-[#12313a]">
                    {profile.customer_full_name ||
                      "Chưa cập nhật họ và tên"}
                  </h3>

                  <p className="mt-1 text-sm text-[#70858b]">
                    Mã khách hàng:{" "}
                    {profile.customer_code || ""}
                  </p>
                </div>

                <span className="w-fit rounded-full bg-[#e8f8f5] px-3 py-1.5 text-xs font-bold text-[#168b87] sm:ml-auto">
                  {getStatusLabel(profile.customer_status)}
                </span>
              </div>

              {/* Basic information */}
              <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="border-b border-[#edf3f3] pb-4">
                  <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a9da1]">
                    Mã khách hàng
                  </dt>

                  <dd className="mt-2 text-sm font-semibold text-[#29444b]">
                    {profile.customer_code || ""}
                  </dd>
                </div>

                <div className="border-b border-[#edf3f3] pb-4">
                  <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a9da1]">
                    Họ và tên
                  </dt>

                  <dd className="mt-2 text-sm font-semibold text-[#29444b]">
                    {profile.customer_full_name || ""}
                  </dd>
                </div>

                <div className="border-b border-[#edf3f3] pb-4">
                  <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a9da1]">
                    Ngày sinh
                  </dt>

                  <dd className="mt-2 text-sm font-semibold text-[#29444b]">
                    {formatDate(profile.customer_date_of_birth)}
                  </dd>
                </div>

                <div className="border-b border-[#edf3f3] pb-4">
                  <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a9da1]">
                    Giới tính
                  </dt>

                  <dd className="mt-2 text-sm font-semibold text-[#29444b]">
                    {getGenderLabel(profile.customer_gender)}
                  </dd>
                </div>

                <div className="border-b border-[#edf3f3] pb-4">
                  <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a9da1]">
                    Trạng thái
                  </dt>

                  <dd className="mt-2 text-sm font-semibold text-[#29444b]">
                    {getStatusLabel(profile.customer_status)}
                  </dd>
                </div>
              </dl>

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={startEditing}
                  className="w-fit rounded-xl bg-[#168b87] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#10736f]"
                >
                  Cập nhật thông tin
                </button>
              </div>

              {/* =========================
                  Address section
              ========================== */}
              <div className="mt-8">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#12313a]">
                      Địa chỉ nhận hàng
                    </h3>

                    <p className="mt-1 text-sm text-[#70858b]">
                      Danh sách địa chỉ của khách hàng.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={startAddingAddress}
                    className="shrink-0 rounded-xl bg-[#168b87] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#117773]"
                  >
                    + Thêm địa chỉ
                  </button>
                </div>

                {/* Address list */}
                {profile.addresses.length > 0 ? (
                  <div className="space-y-4">
                    {profile.addresses.map((address) => (
                      <div
                        key={address.customer_address_id}
                        className="rounded-2xl border border-[#dce8e9] bg-[#f9fcfc] p-5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                          {/* Icon */}
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e8f8f5] text-lg">
                            📍
                          </div>

                          {/* Address information */}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-[#29444b]">
                              {address.customer_address_line || ""}
                            </p>

                            <p className="mt-1 text-sm text-[#70858b]">
                              {[
                                address.customer_address_ward,
                                address.customer_address_province,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </p>

                            {address.customer_address_default && (
                              <span className="mt-3 inline-block rounded-full bg-[#e8f8f5] px-3 py-1 text-xs font-bold text-[#168b87]">
                                Mặc định
                              </span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
                            <button
                              type="button"
                              onClick={() =>
                                startEditingAddress(address)
                              }
                              disabled={
                                deletingAddressId ===
                                address.customer_address_id
                              }
                              className="rounded-xl border border-[#b9dedd] px-4 py-2 text-sm font-bold text-[#168b87] transition hover:bg-[#e8f8f5] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Chỉnh sửa
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteAddress(
                                  address.customer_address_id,
                                )
                              }
                              disabled={
                                deletingAddressId ===
                                address.customer_address_id
                              }
                              className="rounded-xl border border-[#f1c7c3] px-4 py-2 text-sm font-bold text-[#c0392b] transition hover:bg-[#fff0ee] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deletingAddressId ===
                              address.customer_address_id
                                ? "Đang xóa..."
                                : "Xóa"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#cbdadb] bg-[#f9fcfc] p-6">
                    <div className="flex items-center gap-4">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#eef6f7] text-lg">
                        📍
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-[#29444b]">
                          Chưa có địa chỉ
                        </p>

                        <p className="mt-1 text-xs text-[#8a9da1]">
                          Bạn chưa cập nhật địa chỉ nhận hàng.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          EDIT CUSTOMER INFORMATION MODAL
      ====================================================== */}
      {editing && profile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditing();
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="border-b border-[#e4eeee] px-6 py-5">
              <h2 className="text-xl font-bold text-[#12313a]">
                Cập nhật thông tin
              </h2>

              <p className="mt-1 text-sm text-[#70858b]">
                Cập nhật thông tin cá nhân của bạn.
              </p>
            </div>

            {/* Body */}
            <div className="space-y-5 px-6 py-6">
              {/* Full name */}
              <div>
                <label
                  htmlFor="customer-full-name"
                  className="mb-2 block text-sm font-bold text-[#29444b]"
                >
                  Họ và tên
                </label>

                <input
                  id="customer-full-name"
                  type="text"
                  value={formName}
                  onChange={(event) =>
                    setFormName(event.target.value)
                  }
                  placeholder="Nhập họ và tên"
                  className="h-11 w-full rounded-xl border border-[#d9e4e5] bg-white px-4 text-sm text-[#29444b] outline-none transition placeholder:text-[#a2b1b4] focus:border-[#168b87] focus:ring-2 focus:ring-[#168b8730]"
                />
              </div>

              {/* Date of birth */}
              <div>
                <label
                  htmlFor="customer-date-of-birth"
                  className="mb-2 block text-sm font-bold text-[#29444b]"
                >
                  Ngày sinh
                </label>

                <input
                  id="customer-date-of-birth"
                  type="date"
                  value={formDateOfBirth}
                  onChange={(event) =>
                    setFormDateOfBirth(event.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-[#d9e4e5] bg-white px-4 text-sm text-[#29444b] outline-none transition focus:border-[#168b87] focus:ring-2 focus:ring-[#168b8730]"
                />
              </div>

              {/* Gender */}
              <div>
                <label
                  htmlFor="customer-gender"
                  className="mb-2 block text-sm font-bold text-[#29444b]"
                >
                  Giới tính
                </label>

                <select
                  id="customer-gender"
                  value={formGender}
                  onChange={(event) =>
                    setFormGender(event.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-[#d9e4e5] bg-white px-4 text-sm text-[#29444b] outline-none transition focus:border-[#168b87] focus:ring-2 focus:ring-[#168b8730]"
                >
                  <option value="">Chọn giới tính</option>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>

              {/* Error */}
              {editError && (
                <div className="rounded-xl bg-[#fff0ee] px-4 py-3 text-sm text-[#c0392b]">
                  {editError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-[#e4eeee] px-6 py-4">
              <button
                type="button"
                onClick={closeEditing}
                disabled={saving}
                className="rounded-xl border border-[#d9e4e5] px-5 py-3 text-sm font-bold text-[#526b71] transition hover:bg-[#f5f8f8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={saveCustomerProfile}
                disabled={saving}
                className="rounded-xl bg-[#168b87] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#10736f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          EDIT CUSTOMER ADDRESS MODAL
      ====================================================== */}
      {editingAddress && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAddressEditing();
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="border-b border-[#e4eeee] px-6 py-5">
              <h2 className="text-xl font-bold text-[#12313a]">
                Chỉnh sửa địa chỉ
              </h2>

              <p className="mt-1 text-sm text-[#70858b]">
                Cập nhật thông tin địa chỉ nhận hàng.
              </p>
            </div>

            {/* Body */}
            <div className="space-y-5 px-6 py-6">
              {/* Address line */}
              <div>
                <label
                  htmlFor="customer-address-line"
                  className="mb-2 block text-sm font-bold text-[#29444b]"
                >
                  Địa chỉ
                </label>

                <input
                  id="customer-address-line"
                  type="text"
                  value={formAddressLine}
                  onChange={(event) =>
                    setFormAddressLine(event.target.value)
                  }
                  placeholder="Nhập số nhà, tên đường"
                  className="h-11 w-full rounded-xl border border-[#d9e4e5] bg-white px-4 text-sm text-[#29444b] outline-none transition placeholder:text-[#a2b1b4] focus:border-[#168b87] focus:ring-2 focus:ring-[#168b8730]"
                />
              </div>

              {/* Ward */}
              <div>
                <label
                  htmlFor="customer-address-ward"
                  className="mb-2 block text-sm font-bold text-[#29444b]"
                >
                  Phường / Xã
                </label>

                <input
                  id="customer-address-ward"
                  type="text"
                  value={formAddressWard}
                  onChange={(event) =>
                    setFormAddressWard(event.target.value)
                  }
                  placeholder="Nhập phường / xã"
                  className="h-11 w-full rounded-xl border border-[#d9e4e5] bg-white px-4 text-sm text-[#29444b] outline-none transition placeholder:text-[#a2b1b4] focus:border-[#168b87] focus:ring-2 focus:ring-[#168b8730]"
                />
              </div>

              {/* Province */}
              <div>
                <label
                  htmlFor="customer-address-province"
                  className="mb-2 block text-sm font-bold text-[#29444b]"
                >
                  Tỉnh / Thành phố
                </label>

                <input
                  id="customer-address-province"
                  type="text"
                  value={formAddressProvince}
                  onChange={(event) =>
                    setFormAddressProvince(event.target.value)
                  }
                  placeholder="Nhập tỉnh / thành phố"
                  className="h-11 w-full rounded-xl border border-[#d9e4e5] bg-white px-4 text-sm text-[#29444b] outline-none transition placeholder:text-[#a2b1b4] focus:border-[#168b87] focus:ring-2 focus:ring-[#168b8730]"
                />
              </div>

              {/* Default */}
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={formAddressDefault}
                  onChange={(event) =>
                    setFormAddressDefault(event.target.checked)
                  }
                  className="h-4 w-4 accent-[#168b87]"
                />

                <span className="text-sm font-semibold text-[#29444b]">
                  Đặt làm địa chỉ mặc định
                </span>
              </label>

              {/* Error */}
              {addressEditError && (
                <div className="rounded-xl bg-[#fff0ee] px-4 py-3 text-sm text-[#c0392b]">
                  {addressEditError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-[#e4eeee] px-6 py-4">
              <button
                type="button"
                onClick={closeAddressEditing}
                disabled={savingAddress}
                className="rounded-xl border border-[#d9e4e5] px-5 py-3 text-sm font-bold text-[#526b71] transition hover:bg-[#f5f8f8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={saveAddress}
                disabled={savingAddress}
                className="rounded-xl bg-[#168b87] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#10736f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingAddress
                  ? "Đang lưu..."
                  : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          ADD ADDRESS MODAL
      ====================================================== */}
      {addingAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5">
                <h2 className="text-xl font-bold text-[#12313a]">
                Thêm địa chỉ nhận hàng
                </h2>

                <p className="mt-1 text-sm text-[#70858b]">
                Vui lòng cung cấp thông tin địa chỉ nhận hàng.
                </p>
            </div>

            <div className="space-y-4">
                {/* Địa chỉ */}
                <div>
                <label className="mb-1.5 block text-sm font-bold text-[#12313a]">
                    Địa chỉ
                </label>

                <input
                    type="text"
                    value={newAddressLine}
                    onChange={(e) => setNewAddressLine(e.target.value)}
                    placeholder="Số nhà, tên đường..."
                    className="w-full rounded-xl border border-[#d5e2e4] px-4 py-3 text-sm outline-none transition focus:border-[#168b87]"
                />
                </div>

                {/* Phường/Xã */}
                <div>
                <label className="mb-1.5 block text-sm font-bold text-[#12313a]">
                    Phường/Xã
                </label>

                <input
                    type="text"
                    value={newAddressWard}
                    onChange={(e) => setNewAddressWard(e.target.value)}
                    placeholder="Nhập phường/xã"
                    className="w-full rounded-xl border border-[#d5e2e4] px-4 py-3 text-sm outline-none transition focus:border-[#168b87]"
                />
                </div>

                {/* Tỉnh/Thành phố */}
                <div>
                <label className="mb-1.5 block text-sm font-bold text-[#12313a]">
                    Tỉnh/Thành phố
                </label>

                <input
                    type="text"
                    value={newAddressProvince}
                    onChange={(e) => setNewAddressProvince(e.target.value)}
                    placeholder="Nhập tỉnh/thành phố"
                    className="w-full rounded-xl border border-[#d5e2e4] px-4 py-3 text-sm outline-none transition focus:border-[#168b87]"
                />
                </div>

                {/* Mặc định */}
                <label className="flex cursor-pointer items-center gap-3">
                <input
                    type="checkbox"
                    checked={newAddressDefault}
                    onChange={(e) => setNewAddressDefault(e.target.checked)}
                    className="h-4 w-4 accent-[#168b87]"
                />

                <span className="text-sm font-medium text-[#12313a]">
                    Đặt làm địa chỉ mặc định
                </span>
                </label>

                {addAddressError && (
                <p className="rounded-xl bg-[#fff0ee] px-4 py-3 text-sm font-medium text-[#c0392b]">
                    {addAddressError}
                </p>
                )}
            </div>

            {/* Buttons */}
            <div className="mt-6 flex justify-end gap-3">
                <button
                type="button"
                onClick={closeAddingAddress}
                disabled={savingNewAddress}
                className="rounded-xl border border-[#d5e2e4] px-5 py-2.5 text-sm font-bold text-[#52676d] transition hover:bg-[#f5f8f8] disabled:cursor-not-allowed disabled:opacity-50"
                >
                Hủy
                </button>

                <button
                type="button"
                onClick={saveNewAddress}
                disabled={savingNewAddress}
                className="rounded-xl bg-[#168b87] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#117773] disabled:cursor-not-allowed disabled:opacity-50"
                >
                {savingNewAddress ? "Đang lưu..." : "Thêm địa chỉ"}
                </button>
            </div>
            </div>
        </div>
      )}
    </section>
  );
}
